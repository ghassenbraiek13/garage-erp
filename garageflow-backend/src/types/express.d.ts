import type { Types } from 'mongoose'

export type JwtPayload = {
  sub: string
  email: string
  role: string
  garageId?: string | null
  clientId?: string | null
  iat?: number
  exp?: number
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
      garageId?: Types.ObjectId | null
    }
  }
}

export {}
