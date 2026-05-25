import type { NextFunction, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { getEnv } from '@/config/env'

/** En dev, pas de limite (React Strict Mode + nombreuses requêtes TanStack Query). */
function noLimit(_req: Request, _res: Response, next: NextFunction): void {
  next()
}

export function rateLimiter(kind: 'auth' | 'general') {
  const env = getEnv()
  if (env.NODE_ENV === 'development') {
    return noLimit
  }
  const windowMs = env.RATE_LIMIT_WINDOW_MS
  const max = kind === 'auth' ? env.AUTH_RATE_LIMIT_MAX : env.RATE_LIMIT_MAX
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  })
}
