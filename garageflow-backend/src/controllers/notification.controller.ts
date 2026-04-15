import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { Notification, type INotification } from '@/models/Notification.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'

const NotifPaged = Notification as unknown as PaginateModel<INotification>

export async function list(req: Request, res: Response): Promise<void> {
  const uid = req.user?.sub
  if (!uid) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }
  const { page, limit } = parsePagination(req.query as Record<string, unknown>)
  const result = await NotifPaged.paginate(
    { userId: new mongoose.Types.ObjectId(uid) },
    { page, limit, sort: { createdAt: -1 } },
  )
  res.json(ok(result.docs, buildMeta(result.totalDocs, page, limit)))
}

export async function markRead(req: Request, res: Response): Promise<void> {
  const uid = req.user?.sub
  if (!uid) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }
  await Notification.updateOne(
    { _id: req.params.id, userId: new mongoose.Types.ObjectId(uid) },
    { isRead: true },
  )
  res.json(ok({ read: true }))
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  const uid = req.user?.sub
  if (!uid) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }
  await Notification.updateMany({ userId: new mongoose.Types.ObjectId(uid) }, { isRead: true })
  res.json(ok({ read: true }))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const uid = req.user?.sub
  if (!uid) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }
  await Notification.deleteOne({ _id: req.params.id, userId: new mongoose.Types.ObjectId(uid) })
  res.json(ok({ deleted: true }))
}

export async function unreadCount(req: Request, res: Response): Promise<void> {
  const uid = req.user?.sub
  if (!uid) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }
  const n = await Notification.countDocuments({ userId: new mongoose.Types.ObjectId(uid), isRead: false })
  res.json(ok({ count: n }))
}
