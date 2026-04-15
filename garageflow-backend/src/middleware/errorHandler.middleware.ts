import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { logger } from '@/config/logger'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (typeof err === 'object' && err !== null && 'status' in err && typeof (err as { status?: number }).status === 'number') {
    const status = (err as { status: number }).status
    const message = (err as { message?: string }).message ?? 'Error'
    res.status(status).json({ success: false, message })
    return
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {}
    for (const issue of err.issues) {
      const path = issue.path.join('.') || 'root'
      errors[path] = errors[path] ?? []
      errors[path].push(issue.message)
    }
    res.status(400).json({ success: false, message: 'Validation error', errors })
    return
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string[]> = {}
    for (const [k, v] of Object.entries(err.errors)) {
      errors[k] = [v.message]
    }
    res.status(400).json({ success: false, message: 'Validation error', errors })
    return
  }

  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: number }).code === 11000) {
    const key = Object.keys((err as { keyPattern?: Record<string, number> }).keyPattern ?? {})[0] ?? 'field'
    res.status(409).json({ success: false, message: `Duplicate key: ${key}` })
    return
  }

  if (err instanceof jwt.TokenExpiredError) {
    res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' })
    return
  }

  if (err instanceof jwt.JsonWebTokenError) {
    res.status(401).json({ success: false, message: 'Invalid token', code: 'INVALID_TOKEN' })
    return
  }

  if (typeof err === 'object' && err !== null && 'name' in err && (err as { name?: string }).name === 'MulterError') {
    res.status(413).json({ success: false, message: 'Fichier trop volumineux' })
    return
  }

  logger.error('Unhandled error', err)
  res.status(500).json({ success: false, message: 'Internal server error' })
}
