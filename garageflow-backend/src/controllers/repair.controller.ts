import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { Repair, type IRepair } from '@/models/Repair.model'
import { Vehicle } from '@/models/Vehicle.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { getSocketServer } from '@/sockets/emitter'

const RepairPaged = Repair as unknown as PaginateModel<IRepair>

export async function list(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { page, limit, sort, order } = parsePagination(req.query as Record<string, unknown>)
  const filter: Record<string, unknown> = { garageId }
  if (typeof req.query.status === 'string') filter.status = req.query.status
  if (typeof req.query.mechanicId === 'string' && mongoose.isValidObjectId(req.query.mechanicId)) {
    filter.mechanicId = new mongoose.Types.ObjectId(req.query.mechanicId)
  }
  if (typeof req.query.vehicleId === 'string' && mongoose.isValidObjectId(req.query.vehicleId)) {
    filter.vehicleId = new mongoose.Types.ObjectId(req.query.vehicleId)
  }
  const result = await RepairPaged.paginate(filter, { page, limit, sort: { [sort]: order } })
  res.json(ok(result.docs, buildMeta(result.totalDocs, page, limit)))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const r = await Repair.findOne({ _id: req.params.id, garageId }).populate('vehicleId').populate('clientId')
  if (!r) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(r.toJSON()))
}

export async function create(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const body = req.body as Record<string, unknown>
  const r = await Repair.create({ ...body, garageId })
  res.status(201).json(ok(r.toJSON()))
}

export async function update(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const r = await Repair.findOneAndUpdate({ _id: req.params.id, garageId }, req.body, { new: true })
  if (!r) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(r.toJSON()))
}

export async function patchStatus(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { status } = req.body as { status: string }
  const r = await Repair.findOne({ _id: req.params.id, garageId })
  if (!r) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  r.status = status as IRepair['status']
  if (status === 'completed') {
    r.completedAt = new Date()
    await Vehicle.updateOne({ _id: r.vehicleId }, { lastServiceDate: r.completedAt })
  }
  await r.save()
  const io = getSocketServer()
  io?.to(`garage:${garageId.toString()}`).emit('repair:statusChanged', {
    repairId: r._id.toString(),
    status: r.status,
    vehicleId: r.vehicleId.toString(),
    mechanicId: r.mechanicId?.toString() ?? null,
  })
  res.json(ok(r.toJSON()))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  await Repair.deleteOne({ _id: req.params.id, garageId })
  res.json(ok({ deleted: true }))
}

export async function assign(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { mechanicId } = req.body as { mechanicId: string }
  const r = await Repair.findOneAndUpdate(
    { _id: req.params.id, garageId },
    { mechanicId: new mongoose.Types.ObjectId(mechanicId) },
    { new: true },
  )
  if (!r) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(r.toJSON()))
}
