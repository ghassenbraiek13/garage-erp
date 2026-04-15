import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Part } from '@/models/Part.model'
import { Service } from '@/models/Service.model'
import { ok } from '@/utils/apiResponse'

export async function partsList(req: Request, res: Response): Promise<void> {
  const garageId =
    typeof req.query.garageId === 'string' && mongoose.isValidObjectId(req.query.garageId)
      ? new mongoose.Types.ObjectId(req.query.garageId)
      : null
  if (!garageId) {
    res.status(400).json({ success: false, message: 'garageId required' })
    return
  }
  const filter: Record<string, unknown> = { garageId, isPublic: true }
  if (typeof req.query.category === 'string') filter.category = req.query.category
  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    const q = req.query.search.trim()
    filter.$or = [{ name: new RegExp(q, 'i') }, { reference: new RegExp(q, 'i') }]
  }
  const list = await Part.find(filter).limit(100).lean()
  res.json(ok(list))
}

export async function partGet(req: Request, res: Response): Promise<void> {
  const p = await Part.findOne({ _id: req.params.id, isPublic: true })
  if (!p) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(p.toJSON()))
}

export async function servicesList(req: Request, res: Response): Promise<void> {
  const garageId =
    typeof req.query.garageId === 'string' && mongoose.isValidObjectId(req.query.garageId)
      ? new mongoose.Types.ObjectId(req.query.garageId)
      : null
  if (!garageId) {
    res.status(400).json({ success: false, message: 'garageId required' })
    return
  }
  const filter: Record<string, unknown> = { garageId, isActive: true }
  if (typeof req.query.category === 'string') filter.category = req.query.category
  const list = await Service.find(filter).limit(200).lean()
  res.json(ok(list))
}
