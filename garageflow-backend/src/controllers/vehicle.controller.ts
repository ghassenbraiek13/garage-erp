import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import path from 'path'
import sharp from 'sharp'
import fs from 'fs/promises'
import { Vehicle, type IVehicle } from '@/models/Vehicle.model'
import { Client } from '@/models/Client.model'
import { Repair } from '@/models/Repair.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { decodeVin } from '@/services/vin.service'

const VehiclePaged = Vehicle as unknown as PaginateModel<IVehicle>

export async function list(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { page, limit, sort, order, search } = parsePagination(req.query as Record<string, unknown>)
  const filter: Record<string, unknown> = { garageId }
  if (search) {
    filter.$or = [
      { plate: new RegExp(search, 'i') },
      { vin: new RegExp(search, 'i') },
      { make: new RegExp(search, 'i') },
    ]
  }
  const result = await VehiclePaged.paginate(filter, { page, limit, sort: { [sort]: order } })
  res.json(ok(result.docs, buildMeta(result.totalDocs, page, limit)))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const v = await Vehicle.findOne({ _id: req.params.id, garageId })
  if (!v) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(v.toJSON()))
}

export async function create(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const body = req.body as Record<string, unknown>
  const clientId = new mongoose.Types.ObjectId(String(body.clientId))
  const client = await Client.findOne({ _id: clientId, garageId })
  if (!client) {
    res.status(400).json({ success: false, message: 'Invalid client' })
    return
  }
  const v = await Vehicle.create({ ...body, garageId, clientId })
  await Client.updateOne({ _id: clientId }, { $addToSet: { vehicleIds: v._id } })
  res.status(201).json(ok(v.toJSON()))
}

export async function update(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const v = await Vehicle.findOneAndUpdate({ _id: req.params.id, garageId }, req.body, { new: true })
  if (!v) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(v.toJSON()))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const v = await Vehicle.findOneAndDelete({ _id: req.params.id, garageId })
  if (v?.clientId) {
    await Client.updateOne({ _id: v.clientId }, { $pull: { vehicleIds: v._id } })
  }
  res.json(ok({ deleted: true }))
}

export async function listRepairs(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const r = await Repair.find({ garageId, vehicleId: req.params.id }).sort({ createdAt: -1 }).lean()
  res.json(ok(r))
}

export async function vinDecode(req: Request, res: Response): Promise<void> {
  assertGarage(req)
  const data = await decodeVin(req.params.vin)
  res.json(ok(data))
}

export async function uploadPhotos(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const v = await Vehicle.findOne({ _id: req.params.id, garageId })
  if (!v) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  const file = req.file
  if (!file) {
    res.status(400).json({ success: false, message: 'No file' })
    return
  }
  const full = file.path
  const buf = await sharp(full).resize(1200, 1200, { fit: 'inside' }).toBuffer()
  await fs.writeFile(full, buf)
  const rel = path.posix.join('vehicles', file.filename)
  v.photos = [...(v.photos ?? []), rel]
  await v.save()
  res.json(ok({ photos: v.photos }))
}
