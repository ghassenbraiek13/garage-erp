import 'express-async-errors'
import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import mongoSanitize from 'express-mongo-sanitize'
import path from 'path'
import { getCorsOptions } from '@/config/cors'
import { connectDatabase } from '@/config/database'
import { getEnv } from '@/config/env'
import { logger } from '@/config/logger'
import { errorHandler } from '@/middleware/errorHandler.middleware'
import { rateLimiter } from '@/middleware/rateLimiter.middleware'
import routes from '@/routes/index'
import { initSockets } from '@/sockets'
import { startCronJobs } from '@/services/cron.service'

const app = express()
const httpServer = createServer(app)
const io = new SocketServer(httpServer, { cors: getCorsOptions() })

const env = getEnv()

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors(getCorsOptions()))
app.use(compression())
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(mongoSanitize())
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }))
app.use('/api/v1/auth', rateLimiter('auth'))
app.use('/api/v1', rateLimiter('general'))

app.use('/uploads', express.static(path.resolve(env.UPLOADS_DIR)))

app.use('/api/v1', routes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.url} not found` })
})

app.use(errorHandler)

app.set('io', io)
initSockets(io)

async function bootstrap() {
  await connectDatabase()
  startCronJobs()
  httpServer.listen(env.PORT, () => {
    logger.info(`GarageFlow API http://localhost:${env.PORT}`)
    logger.info(`Environment: ${env.NODE_ENV}`)
  })
}

bootstrap().catch((err) => {
  logger.error('Failed to start', err)
  process.exit(1)
})

export { io }
