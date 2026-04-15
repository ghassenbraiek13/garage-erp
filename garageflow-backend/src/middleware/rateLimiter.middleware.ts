import rateLimit from 'express-rate-limit'
import { getEnv } from '@/config/env'

export function rateLimiter(kind: 'auth' | 'general') {
  const env = getEnv()
  const windowMs = env.RATE_LIMIT_WINDOW_MS
  const max = kind === 'auth' ? env.AUTH_RATE_LIMIT_MAX : env.RATE_LIMIT_MAX
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  })
}
