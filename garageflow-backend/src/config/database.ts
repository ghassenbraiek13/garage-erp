import mongoose from 'mongoose'
import { logger } from './logger'
import { getEnv } from './env'

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

export async function connectDatabase(): Promise<void> {
  const uri = getEnv().MONGODB_URI
  let attempt = 0
  let lastErr: unknown

  while (attempt < MAX_RETRIES) {
    try {
      mongoose.set('strictQuery', true)
      await mongoose.connect(uri)
      logger.info('MongoDB connected')
      return
    } catch (err) {
      lastErr = err
      attempt += 1
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1)
      logger.warn(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed, retry in ${delay}ms`, err)
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  logger.error('MongoDB connection failed after retries', lastErr)
  throw lastErr
}
