import type { Server as SocketServer } from 'socket.io'
import jwt from 'jsonwebtoken'
import { getEnv } from '@/config/env'
import { setSocketServer } from '@/sockets/emitter'
import { logger } from '@/config/logger'
import type { JwtPayload } from '@/types/express'

export function initSockets(io: SocketServer): void {
  setSocketServer(io)

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined
      if (!token) {
        next(new Error('Unauthorized'))
        return
      }
      const payload = jwt.verify(token, getEnv().JWT_ACCESS_SECRET) as JwtPayload
      socket.data.user = payload
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.data.user as JwtPayload | undefined
    if (!user) return
    if (user.garageId) {
      socket.join(`garage:${user.garageId}`)
    }
    if (user.sub) {
      socket.join(`user:${user.sub}`)
    }
    if (user.role === 'client' && user.clientId) {
      socket.join(`client:${user.clientId}`)
    }
    socket.on('join:client', (clientId: string) => {
      if (user.role === 'client' && user.clientId === clientId) {
        socket.join(`client:${clientId}`)
      }
    })
    socket.on('task:statusChanged', (payload: { taskId: string; status: string }) => {
      if (user.garageId) {
        io.to(`garage:${user.garageId}`).emit('task:statusChanged', payload)
      }
    })
    socket.on('disconnect', () => {
      logger.debug(`socket disconnect ${socket.id}`)
    })
  })
}
