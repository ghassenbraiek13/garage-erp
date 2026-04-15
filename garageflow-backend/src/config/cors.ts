import type { CorsOptions } from 'cors'
import { getEnv } from './env'

export function getCorsOptions(): CorsOptions {
  const origin = getEnv().FRONTEND_URL
  return {
    origin: [origin],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
}
