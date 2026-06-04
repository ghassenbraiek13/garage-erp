import type { Request, Response } from 'express'
import type { PaginateModel } from 'mongoose'
import type { Server as SocketServer } from 'socket.io'
import { getEnv } from '@/config/env'
import { logger } from '@/config/logger'
import { Conversation, type IConversation } from '@/models/Conversation.model'
import { ok, fail } from '@/utils/apiResponse'
import { assertGarage } from '@/utils/garageScope'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { getSocketServer } from '@/sockets/emitter'
import { sendChatbotMessageToN8n } from '@/services/email.service'

const ConversationPaged = Conversation as unknown as PaginateModel<IConversation>

function clientRoom(clientId: string): string {
  return `client:${clientId}`
}

function getIo(req: Request): SocketServer | null {
  const fromApp = req.app.get('io') as SocketServer | undefined
  return fromApp ?? getSocketServer()
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const clientId = String(req.user?.clientId ?? '')
  const garageId = String(
    req.user?.garageId ?? req.garageId?.toString() ?? (req.body as { garageId?: string }).garageId ?? '',
  )
  const { question } = req.body as { question?: string }

  if (!clientId) {
    res.status(403).json(fail('Client account required'))
    return
  }
  if (!garageId) {
    res.status(400).json(fail('garageId required'))
    return
  }
  if (!question || question.trim() === '') {
    res.status(400).json({ success: false, message: 'Question requise' })
    return
  }

  let conversation = await Conversation.findOne({
    clientId,
    garageId,
    statut: { $ne: 'closed' },
  })

  if (!conversation) {
    conversation = await Conversation.create({
      clientId,
      garageId,
      statut: 'open',
      messages: [],
    })
  }

  const trimmed = question.trim()
  conversation.messages.push({
    auteur: 'client',
    contenu: trimmed,
    timestamp: new Date(),
    type: 'human',
  })
  await conversation.save()

  const conversationId = String(conversation._id)
  const io = getIo(req)

  if (io) {
    io.to(clientRoom(clientId)).emit('chatbot:message', {
      conversationId,
      message: {
        auteur: 'client',
        contenu: trimmed,
        timestamp: new Date().toISOString(),
      },
    })
  }

  logger.info('[chatbot] Calling n8n webhook', {
    url: getEnv().N8N_CHATBOT_WEBHOOK_URL,
    question: trimmed,
    conversationId,
  })

  const sentToN8n = await sendChatbotMessageToN8n(trimmed, clientId, garageId, conversationId)

  if (!sentToN8n) {
    const fallback =
      'Bonjour ! Votre message a bien été reçu. Notre équipe va vous répondre sous peu.'

    conversation.messages.push({
      auteur: 'bot',
      contenu: fallback,
      timestamp: new Date(),
      type: 'bot',
    })
    await conversation.save()

    if (io) {
      io.to(clientRoom(clientId)).emit('chatbot:reply', {
        conversationId,
        reponse: fallback,
        type: 'bot',
        auteur: 'bot',
        message: {
          auteur: 'bot',
          contenu: fallback,
          timestamp: new Date().toISOString(),
        },
      })
    }
  }

  res.json(
    ok({
      conversationId,
      sentToN8n,
      message: sentToN8n ? 'Message envoyé à n8n' : 'Message reçu — réponse automatique envoyée',
    }),
  )
}

/** POST /chatbot/respond — webhook n8n (sans auth) */
export async function respond(req: Request, res: Response): Promise<void> {
  const { conversationId, reponse, type, clientId } = req.body as {
    conversationId?: string
    reponse?: string
    type?: 'bot' | 'human_needed' | 'human'
    clientId?: string
  }

  if (!conversationId || !reponse) {
    res.status(400).json({
      success: false,
      message: 'conversationId et reponse sont requis',
    })
    return
  }

  const conversation = await Conversation.findById(conversationId)

  if (!conversation) {
    res.status(404).json({
      success: false,
      message: 'Conversation introuvable',
    })
    return
  }

  const humanNeeded = type === 'human_needed' || type === 'human'
  const socketAuteur = humanNeeded ? 'human_needed' : 'bot'
  const timestamp = new Date()

  conversation.messages.push({
    auteur: 'bot',
    contenu: reponse,
    timestamp,
    type: humanNeeded ? 'human' : 'bot',
  })

  if (humanNeeded) {
    conversation.statut = 'pending_human'
  }

  await conversation.save()

  const targetClientId = clientId ? String(clientId) : String(conversation.clientId)
  const io = getIo(req)

  if (io && targetClientId) {
    io.to(clientRoom(targetClientId)).emit('chatbot:reply', {
      conversationId,
      reponse,
      type: humanNeeded ? 'human' : 'bot',
      auteur: 'bot',
      message: {
        auteur: socketAuteur,
        contenu: reponse,
        timestamp: timestamp.toISOString(),
      },
    })
    logger.info('[chatbot] Socket.io event emitted', {
      clientId: targetClientId,
      conversationId,
      auteur: socketAuteur,
    })
  } else {
    logger.warn('[chatbot] Socket.io not available or clientId missing', {
      clientId: targetClientId,
      conversationId,
    })
  }

  res.json({
    success: true,
    message: 'Réponse enregistrée',
    conversationId,
    auteur: socketAuteur,
  })
}

/** @deprecated Alias — utiliser respond */
export const addBotResponse = respond

export async function managerReply(req: Request, res: Response): Promise<void> {
  const { conversationId, reponse } = req.body as { conversationId: string; reponse: string }
  const conv = await Conversation.findById(conversationId)
  if (!conv) {
    res.status(404).json(fail('Conversation not found'))
    return
  }

  const garageId = assertGarage(req)
  if (String(conv.garageId) !== String(garageId)) {
    res.status(403).json(fail('Forbidden'))
    return
  }

  const timestamp = new Date()
  conv.messages.push({
    auteur: 'manager',
    contenu: reponse,
    timestamp,
    type: 'human',
  })
  conv.statut = 'open'
  await conv.save()

  const io = getIo(req)
  if (io) {
    io.to(clientRoom(String(conv.clientId))).emit('chatbot:reply', {
      conversationId: String(conv._id),
      reponse,
      type: 'human',
      auteur: 'manager',
      message: {
        auteur: 'manager',
        contenu: reponse,
        timestamp: timestamp.toISOString(),
      },
    })
  }

  res.json(ok({ success: true }))
}

export async function getConversations(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { page, limit, sort, order } = parsePagination(req.query as Record<string, unknown>)
  const result = await ConversationPaged.paginate(
    { garageId },
    {
      page,
      limit,
      sort: { [sort]: order },
      populate: { path: 'clientId', select: 'name email' },
    },
  )
  res.json(ok(result.docs, buildMeta(result.totalDocs, page, limit)))
}

export async function getMyConversation(req: Request, res: Response): Promise<void> {
  const clientId = req.user?.clientId
  if (!clientId) {
    res.status(403).json(fail('Client account required'))
    return
  }

  const { garageId } = req.query as { garageId?: string }
  const filter: Record<string, unknown> = { clientId, statut: { $ne: 'closed' } }
  if (garageId) filter.garageId = garageId

  const conv = await Conversation.findOne(filter).sort({ updatedAt: -1 })
  if (!conv) {
    res.json(ok(null))
    return
  }
  res.json(ok(conv.toJSON()))
}
