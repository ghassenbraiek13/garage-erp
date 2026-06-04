import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import path from 'path'
import sharp from 'sharp'
import fs from 'fs/promises'
import { Vehicle, type IVehicle } from '@/models/Vehicle.model'
import { Client } from '@/models/Client.model'
import { Repair } from '@/models/Repair.model'
import axios from 'axios'
import { ok, fail } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { decodeVin, getVinMatches } from '@/services/vin.service'

const VehiclePaged = Vehicle as unknown as PaginateModel<IVehicle>

export async function list(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { page, limit, sort, order, search } = parsePagination(req.query as Record<string, unknown>)
  const filter: Record<string, unknown> = { garageId }
  if (req.user?.role === 'client' && req.user.clientId) {
    filter.clientId = new mongoose.Types.ObjectId(req.user.clientId)
  }
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
  const filter: Record<string, unknown> = { _id: req.params.id, garageId }
  if (req.user?.role === 'client' && req.user.clientId) {
    filter.clientId = new mongoose.Types.ObjectId(req.user.clientId)
  }
  const v = await Vehicle.findOne(filter)
  if (!v) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(v.toJSON()))
}

export async function create(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const body = req.body as Record<string, unknown>
  let clientIdStr = String(body.clientId)
  if (req.user?.role === 'client') {
    if (!req.user.clientId) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    clientIdStr = req.user.clientId
    body.clientId = clientIdStr
  }
  const clientId = new mongoose.Types.ObjectId(clientIdStr)
  const client = await Client.findOne({ _id: clientId, garageId })
  if (!client) {
    res.status(400).json({ success: false, message: 'Invalid client' })
    return
  }
  const v = await Vehicle.create({
    ...body,
    garageId,
    clientId,
    transmission: body.transmission,
    bodyType: body.bodyType,
    doors: body.doors,
    power: body.power,
    displacement: body.displacement,
    co2: body.co2,
  })
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

export async function vinMatches(req: Request, res: Response): Promise<void> {
  try {
    assertGarage(req)
    const vin = String(req.params.vin ?? '').trim().toUpperCase()
    if (vin.length !== 17) {
      res.status(400).json(fail('VIN invalide — 17 caractères requis'))
      return
    }
    const matches = await getVinMatches(vin)
    if (matches.length === 0) {
      res.status(404).json(fail('Aucun véhicule trouvé pour ce VIN'))
      return
    }
    res.json(ok(matches))
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        res.status(404).json(fail('Aucun véhicule trouvé pour ce VIN'))
        return
      }
      if (err.response?.status === 429) {
        res.status(429).json(fail('Limite API atteinte — reessayez plus tard'))
        return
      }
    }
    const message = err instanceof Error ? err.message : 'Erreur décodage VIN'
    res.status(400).json(fail(message))
  }
}

export async function vinDecode(req: Request, res: Response): Promise<void> {
  try {
    assertGarage(req)
    const vin = String(req.params.vin ?? '').trim().toUpperCase()
    if (!vin || vin.length !== 17) {
      res.status(400).json(fail('Le VIN doit contenir exactement 17 caracteres'))
      return
    }
    const matchId = typeof req.query.matchId === 'string' ? req.query.matchId : undefined
    const matchType = typeof req.query.matchType === 'string' ? req.query.matchType : undefined
    const match =
      matchId && matchType ? { id: matchId, recordType: matchType } : undefined
    const result = await decodeVin(vin.toUpperCase(), match)
    res.json(ok(result))
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        res.status(404).json(fail('VIN non reconnu — verifiez le numero saisi'))
        return
      }
      if (err.response?.status === 429) {
        res.status(429).json(fail('Limite API atteinte — reessayez plus tard'))
        return
      }
    }
    const message = err instanceof Error ? err.message : 'Erreur lors du decodage VIN'
    res.status(400).json(fail(message))
  }
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
