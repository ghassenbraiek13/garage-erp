import mongoose from 'mongoose'
import { Notification, type INotification } from '@/models/Notification.model'
import { getSocketServer } from '@/sockets/emitter'

export async function saveInAppNotification(input: Omit<INotification, 'createdAt'>): Promise<void> {
  await Notification.create({
    ...input,
    createdAt: new Date(),
  })
  const io = getSocketServer()
  if (io) {
    io.to(`user:${input.userId.toString()}`).emit('notification:new', { userId: input.userId.toString() })
  }
}

export async function notifyManagers(
  garageId: mongoose.Types.ObjectId,
  payload: Omit<INotification, 'createdAt' | 'garageId' | 'userId'> & { userId?: mongoose.Types.ObjectId },
): Promise<void> {
  const { User } = await import('@/models/User.model')
  const managers = await User.find({
    garageId,
    role: { $in: ['manager', 'cashier'] },
    isActive: true,
  }).select('_id')
  for (const m of managers) {
    await saveInAppNotification({
      garageId,
      userId: m._id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link,
      data: payload.data,
      isRead: false,
    })
  }
}
