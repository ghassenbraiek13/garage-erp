import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { getEnv } from '@/config/env'
import type { JwtPayload } from '@/types/express'

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized', code: 'INVALID_TOKEN' })
    return
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, getEnv().JWT_ACCESS_SECRET) as JwtPayload
    req.user = payload
    if (payload.role === 'superadmin') {
      const q = req.query.garageId
      req.garageId =
        typeof q === 'string' && mongoose.isValidObjectId(q) ? new mongoose.Types.ObjectId(q) : null
    } else if (payload.garageId) {
      req.garageId = new mongoose.Types.ObjectId(payload.garageId)
    } else {
      req.garageId = null
    }
    next()
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' })
      return
    }
    res.status(401).json({ success: false, message: 'Invalid token', code: 'INVALID_TOKEN' })
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next()
    return
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, getEnv().JWT_ACCESS_SECRET) as JwtPayload
    req.user = payload
    if (payload.garageId) {
      req.garageId = new mongoose.Types.ObjectId(payload.garageId)
    }
  } catch {
    /* ignore */
  }
  next()
}
