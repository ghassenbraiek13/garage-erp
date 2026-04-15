import type { Request } from 'express'
import mongoose from 'mongoose'

export function assertGarage(req: Request): mongoose.Types.ObjectId {
  if (!req.garageId) {
    const e = new Error('Garage context required') as Error & { status: number }
    e.status = 400
    throw e
  }
  return req.garageId
}

export function scopeGarageId(req: Request): mongoose.Types.ObjectId | null {
  if (req.user?.role === 'superadmin') {
    const q = req.query.garageId
    if (typeof q === 'string' && mongoose.isValidObjectId(q)) {
      return new mongoose.Types.ObjectId(q)
    }
    return null
  }
  return req.garageId ?? null
}
