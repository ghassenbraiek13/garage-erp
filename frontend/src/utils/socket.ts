import { io, type Socket } from 'socket.io-client'
import { getAccessToken } from '@/utils/authToken'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL as string, {
      autoConnect: false,
      auth: { token: getAccessToken() ?? '' },
    })
  }
  return socket
}

export function connectSocket(): void {
  const s = getSocket()
  ;(s as Socket & { auth: { token: string } }).auth = { token: getAccessToken() ?? '' }
  if (!s.connected) s.connect()
}

export function disconnectSocket(): void {
  getSocket().disconnect()
}
