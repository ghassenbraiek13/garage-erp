import { Router } from 'express'
import * as ctrl from '@/controllers/chatbot.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'
import { validateBody } from '@/middleware/validate.middleware'
import { BotResponseSchema, ManagerReplySchema, SendMessageSchema } from '@/schemas/chatbot.schema'

const r = Router()

// Client
r.post('/message', verifyToken, requireRole('client'), validateBody(SendMessageSchema), ctrl.sendMessage)
r.get('/my', verifyToken, requireRole('client'), ctrl.getMyConversation)
r.get('/my-conversation', verifyToken, requireRole('client'), ctrl.getMyConversation)

// n8n webhook — pas d'auth
r.post('/respond', validateBody(BotResponseSchema), ctrl.respond)

// Manager
r.get(
  '/conversations',
  verifyToken,
  requireRole('manager', 'cashier', 'superadmin'),
  ctrl.getConversations,
)
r.post(
  '/manager-reply',
  verifyToken,
  requireRole('manager', 'cashier', 'superadmin'),
  validateBody(ManagerReplySchema),
  ctrl.managerReply,
)

export default r
