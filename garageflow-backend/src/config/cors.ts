import type { CorsOptions } from 'cors'
import { getEnv } from './env'

/** En dev, Vite peut passer sur 5174 (ou autre) si 5173 est pris — inclure les ports usuels. */
const DEV_LOCAL_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
] as const

export function getCorsOptions(): CorsOptions {
  const env = getEnv()
  const primary = env.FRONTEND_URL
  const origins =
    env.NODE_ENV === 'development'
      ? [...new Set<string>([primary, ...DEV_LOCAL_ORIGINS])]
      : [primary]
  return {
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
}
