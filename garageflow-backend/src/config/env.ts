import { config } from 'dotenv'
import { z } from 'zod'

config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().url(),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_DEV_REDIRECT: z.string().email().optional(),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_FROM: z.string().optional().default('GarageFlow <onboarding@resend.dev>'),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().default(5),
  UPLOADS_DIR: z.string().default('./uploads'),
  AUTOREF_API_KEY: z.string().optional().default(''),
  AUTOREF_BASE_URL: z.string().url().default('https://api-gateway.autoref.eu'),
  /** Fenêtre rate limit (ms). Défaut : 15 min. */
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  /** Requêtes max / fenêtre sur /api/v1 (hors auth). */
  RATE_LIMIT_MAX: z.coerce.number().default(500),
  /** Requêtes max / fenêtre sur /api/v1/auth. */
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(30),
  LOG_LEVEL: z.string().default('info'),
  N8N_INVOICE_WEBHOOK_URL: z
    .preprocess((v) => (v === '' || v === undefined ? undefined : v), z.string().url())
    .optional(),
  N8N_CHATBOT_WEBHOOK_URL: z
    .preprocess((v) => (v === '' || v === undefined ? undefined : v), z.string().url())
    .optional(),
  N8N_WEBHOOK_URL: z
    .preprocess((v) => (v === '' || v === undefined ? undefined : v), z.string().url())
    .optional(),
  BACKEND_URL: z
    .preprocess((v) => (v === '' || v === undefined ? undefined : v), z.string().url())
    .default('http://localhost:5000'),
})

export type Env = z.infer<typeof envSchema>

let cached: Env | null = null

export function getEnv(): Env {
  if (cached) return cached
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
    process.exit(1)
  }
  cached = parsed.data
  return cached
}

export const env = new Proxy({} as Env, {
  get(_, prop: string) {
    return getEnv()[prop as keyof Env]
  },
})

/** Clés Autoref (proxy via backend uniquement). */
export const autorefConfig = {
  get autorefApiKey() {
    return getEnv().AUTOREF_API_KEY ?? ''
  },
  get autorefBaseUrl() {
    return getEnv().AUTOREF_BASE_URL ?? 'https://api-gateway.autoref.eu'
  },
}
