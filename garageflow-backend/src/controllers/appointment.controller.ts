import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { Appointment, type IAppointment } from '@/models/Appointment.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { sendAppointmentConfirmation } from '@/services/email.service'
import { Client } from '@/models/Client.model'
import { findOverlappingAppointment } from '@/services/appointmentConflict.service'
import { getSocketServer } from '@/sockets/emitter'

const ApptPaged = Appointment as unknown as PaginateModel<IAppointment>

export async function list(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const q = req.query as Record<string, unknown>
  let { page, limit, sort, order } = parsePagination(q)
  const hasRange = typeof q.start === 'string' && typeof q.end === 'string' && q.start && q.end

  /* Fenêtre calendrier : plage élargie, tri par date de début, sinon on ne voit qu’une fraction des RDV (limite 100 + tri createdAt). */
  if (hasRange) {
    limit = Math.min(500, Math.max(1, Number(q.limit) || 200))
    if (q.sort === undefined && q.order === undefined) {
      sort = 'start'
      order = 1
    }
  }

  const filter: Record<string, unknown> = { garageId }
  if (req.user?.role === 'client' && req.user.clientId) {
    filter.clientId = new mongoose.Types.ObjectId(req.user.clientId)
  }
  if (typeof req.query.status === 'string') filter.status = req.query.status
  if (typeof req.query.mechanicId === 'string' && mongoose.isValidObjectId(req.query.mechanicId)) {
    filter.mechanicId = new mongoose.Types.ObjectId(req.query.mechanicId)
  }
  /* Chevauchement avec [start, end] : inclut les RDV qui commencent avant la fenêtre mais se terminent dedans, etc. */
  if (hasRange) {
    const rangeStart = new Date(String(q.start))
    const rangeEnd = new Date(String(q.end))
    filter.$and = [{ start: { $lt: rangeEnd } }, { end: { $gt: rangeStart } }]
  }
  const populate = [
    { path: 'clientId', select: 'name phone email' },
    { path: 'vehicleId', select: 'make model plate year' },
    { path: 'serviceId', select: 'name category price' },
    { path: 'mechanicId', select: 'name email' },
  ]
  const result = await ApptPaged.paginate(filter, { page, limit, sort: { [sort]: order }, populate })
  res.json(ok(result.docs, buildMeta(result.totalDocs, page, limit)))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const a = await Appointment.findOne({ _id: req.params.id, garageId })
    .populate('clientId')
    .populate('vehicleId')
    .populate('serviceId')
  if (!a) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(a.toJSON()))
}

export async function create(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const body = req.body as Record<string, unknown>
  if (req.user?.role === 'client') {
    if (!req.user.clientId) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    body.clientId = req.user.clientId
  }
  const start = new Date(String(body.start))
  const end = new Date(String(body.end))
  const overlap = await findOverlappingAppointment(garageId, start, end)
  if (overlap) {
    res.status(409).json({
      success: false,
      code: 'SLOT_CONFLICT',
      message:
        'Ce créneau chevauche un rendez-vous existant. Choisissez une autre plage horaire ou un autre horaire.',
      data: {
        conflictingId: overlap.id,
        conflictingStart: overlap.start.toISOString(),
        conflictingEnd: overlap.end.toISOString(),
      },
    })
    return
  }
  const a = await Appointment.create({
    garageId,
    clientId: new mongoose.Types.ObjectId(String(body.clientId)),
    vehicleId: new mongoose.Types.ObjectId(String(body.vehicleId)),
    serviceId: body.serviceId ? new mongoose.Types.ObjectId(String(body.serviceId)) : null,
    mechanicId: body.mechanicId ? new mongoose.Types.ObjectId(String(body.mechanicId)) : null,
    start,
    end,
    notes: body.notes as string | undefined,
  })
  const client = await Client.findById(a.clientId)
  if (client?.email) {
    await sendAppointmentConfirmation(client.email, a.start.toISOString())
  }
  res.status(201).json(ok(a.toJSON()))
}

export async function update(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ success: false, message: 'Invalid id' })
    return
  }
  const apptId = new mongoose.Types.ObjectId(req.params.id)
  const body = req.body as Record<string, unknown>
  const existing = await Appointment.findOne({ _id: apptId, garageId }).lean()
  if (!existing) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  const nextStart = body.start ? new Date(String(body.start)) : new Date((existing as { start: Date }).start)
  const nextEnd = body.end ? new Date(String(body.end)) : new Date((existing as { end: Date }).end)
  const overlap = await findOverlappingAppointment(garageId, nextStart, nextEnd, apptId)
  if (overlap) {
    res.status(409).json({
      success: false,
      code: 'SLOT_CONFLICT',
      message:
        'Ce créneau chevauche un rendez-vous existant. Choisissez une autre plage horaire ou un autre horaire.',
      data: {
        conflictingId: overlap.id,
        conflictingStart: overlap.start.toISOString(),
        conflictingEnd: overlap.end.toISOString(),
      },
    })
    return
  }
  const payload = { ...body } as Record<string, unknown>
  if (body.clientId) payload.clientId = new mongoose.Types.ObjectId(String(body.clientId))
  if (body.vehicleId) payload.vehicleId = new mongoose.Types.ObjectId(String(body.vehicleId))
  if (body.serviceId) payload.serviceId = new mongoose.Types.ObjectId(String(body.serviceId))
  if (body.mechanicId) payload.mechanicId = new mongoose.Types.ObjectId(String(body.mechanicId))
  if (body.start) payload.start = new Date(String(body.start))
  if (body.end) payload.end = new Date(String(body.end))
  const a = await Appointment.findOneAndUpdate({ _id: apptId, garageId }, payload, { new: true })
  if (!a) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  const io = getSocketServer()
  io?.to(`garage:${garageId.toString()}`).emit('appointment:updated', {
    appointmentId: a._id.toString(),
    start: a.start,
    end: a.end,
    mechanicId: a.mechanicId?.toString() ?? null,
  })
  res.json(ok(a.toJSON()))
}

export async function patchStatus(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { status } = req.body as { status: string }
  const a = await Appointment.findOneAndUpdate({ _id: req.params.id, garageId }, { status }, { new: true })
  if (!a) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(a.toJSON()))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ success: false, message: 'Invalid id' })
    return
  }
  const result = await Appointment.deleteOne({ _id: req.params.id, garageId })
  if (result.deletedCount === 0) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok({ deleted: true, id: req.params.id }))
}

export async function upcoming(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const until = new Date()
  until.setDate(until.getDate() + 14)
  const filter: Record<string, unknown> = { garageId, start: { $gte: new Date(), $lte: until } }
  if (req.user?.role === 'client' && req.user.clientId) {
    filter.clientId = new mongoose.Types.ObjectId(req.user.clientId)
  }
  const list = await Appointment.find(filter)
    .sort({ start: 1 })
    .populate('clientId')
    .populate('vehicleId')
    .lean()
  res.json(ok(list))
}
