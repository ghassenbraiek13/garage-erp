import { z } from 'zod'

const oid = z.string().regex(/^[0-9a-fA-F]{24}$/)

export const SendMessageSchema = z.object({
  question: z.string().min(1),
  garageId: oid.optional(),
})

export const BotResponseSchema = z.object({
  conversationId: oid,
  reponse: z.string().min(1),
  type: z.enum(['bot', 'human_needed', 'human']).default('bot'),
  clientId: oid,
})

export const ManagerReplySchema = z.object({
  conversationId: oid,
  reponse: z.string().min(1),
})
