import type { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'

/** Resolves garage scope: superadmin may pass ?garageId= ; others use JWT garageId. */
export function resolveGarageScope(req: Request, res: Response, next: NextFunction): void {
  const role = req.user?.role
  if (role === 'superadmin') {
    const q = req.query.garageId
    if (typeof q === 'string' && mongoose.isValidObjectId(q)) {
      req.garageId = new mongoose.Types.ObjectId(q)
    } else {
      req.garageId = undefined
    }
    next()
    return
  }
  if (!req.garageId && role !== 'client') {
    res.status(400).json({ success: false, message: 'Garage context required' })
    return
  }
  next()
}

export function requireGarageId(req: Request, res: Response, next: NextFunction): void {
  if (!req.garageId) {
    res.status(400).json({ success: false, message: 'garageId required' })
    return
  }
  next()
}
