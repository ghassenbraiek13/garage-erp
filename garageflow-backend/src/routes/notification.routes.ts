import { Router } from 'express'
import * as ctrl from '@/controllers/notification.controller'
import { verifyToken } from '@/middleware/auth.middleware'

const r = Router()

r.get('/unread-count', verifyToken, ctrl.unreadCount)
r.get('/', verifyToken, ctrl.list)
r.patch('/read-all', verifyToken, ctrl.markAllRead)
r.patch('/:id/read', verifyToken, ctrl.markRead)
r.delete('/:id', verifyToken, ctrl.remove)

export default r
