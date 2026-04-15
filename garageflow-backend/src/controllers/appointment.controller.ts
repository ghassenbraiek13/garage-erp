import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { Appointment, type IAppointment } from '@/models/Appointment.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { sendAppointmentConfirmation } from '@/services/email.service'
import { Client } from '@/models/Client.model'

const ApptPaged = Appointment as unknown as PaginateModel<IAppointment>

export async function list(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { page, limit, sort, order } = parsePagination(req.query as Record<string, unknown>)
  const filter: Record<string, unknown> = { garageId }
  if (typeof req.query.status === 'string') filter.status = req.query.status
  if (typeof req.query.mechanicId === 'string' && mongoose.isValidObjectId(req.query.mechanicId)) {
    filter.mechanicId = new mongoose.Types.ObjectId(req.query.mechanicId)
  }
  if (req.query.start && req.query.end) {
    filter.start = {
      $gte: new Date(String(req.query.start)),
      $lte: new Date(String(req.query.end)),
    }
  }
  const result = await ApptPaged.paginate(filter, { page, limit, sort: { [sort]: order } })
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
  const a = await Appointment.create({
    garageId,
    clientId: new mongoose.Types.ObjectId(String(body.clientId)),
    vehicleId: new mongoose.Types.ObjectId(String(body.vehicleId)),
    serviceId: body.serviceId ? new mongoose.Types.ObjectId(String(body.serviceId)) : null,
    mechanicId: body.mechanicId ? new mongoose.Types.ObjectId(String(body.mechanicId)) : null,
    start: new Date(String(body.start)),
    end: new Date(String(body.end)),
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
  const body = req.body as Record<string, unknown>
  const payload = { ...body } as Record<string, unknown>
  if (body.clientId) payload.clientId = new mongoose.Types.ObjectId(String(body.clientId))
  if (body.vehicleId) payload.vehicleId = new mongoose.Types.ObjectId(String(body.vehicleId))
  if (body.serviceId) payload.serviceId = new mongoose.Types.ObjectId(String(body.serviceId))
  if (body.mechanicId) payload.mechanicId = new mongoose.Types.ObjectId(String(body.mechanicId))
  if (body.start) payload.start = new Date(String(body.start))
  if (body.end) payload.end = new Date(String(body.end))
  const a = await Appointment.findOneAndUpdate({ _id: req.params.id, garageId }, payload, { new: true })
  if (!a) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
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
  await Appointment.deleteOne({ _id: req.params.id, garageId })
  res.json(ok({ deleted: true }))
}

export async function upcoming(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const until = new Date()
  until.setDate(until.getDate() + 14)
  const list = await Appointment.find({ garageId, start: { $gte: new Date(), $lte: until } })
    .sort({ start: 1 })
    .populate('clientId')
    .populate('vehicleId')
    .lean()
  res.json(ok(list))
}
