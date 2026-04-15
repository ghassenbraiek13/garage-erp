import type { NextFunction, Request, Response } from 'express'
import type { RequestHandler } from 'express'
import type { UserRole } from '@/models/User.model'

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role as UserRole | undefined
    if (!role || !roles.includes(role)) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    next()
  }
}

export function requireSuperadmin(): RequestHandler {
  return requireRole('superadmin')
}
