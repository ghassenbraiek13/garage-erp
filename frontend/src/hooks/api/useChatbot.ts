import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'

export type ChatMessage = {
  auteur: 'client' | 'bot' | 'manager'
  contenu: string
  timestamp: string
  type: 'bot' | 'human'
}

export type ApiConversation = {
  id: string
  clientId: { id: string; name: string; email?: string } | string
  garageId: string
  statut: 'open' | 'pending_human' | 'closed'
  messages: ChatMessage[]
  createdAt?: string
  updatedAt?: string
}

function mapConversation(raw: Record<string, unknown>): ApiConversation {
  const clientId = raw.clientId
  let parsedClient: ApiConversation['clientId'] = String(clientId ?? '')
  if (clientId && typeof clientId === 'object') {
    const c = clientId as Record<string, unknown>
    parsedClient = {
      id: String(c.id ?? c._id ?? ''),
      name: String(c.name ?? ''),
      email: c.email ? String(c.email) : undefined,
    }
  }
  return {
    id: String(raw.id ?? raw._id ?? ''),
    clientId: parsedClient,
    garageId: String(raw.garageId ?? ''),
    statut: (raw.statut as ApiConversation['statut']) ?? 'open',
    messages: Array.isArray(raw.messages) ? (raw.messages as ChatMessage[]) : [],
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
  }
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { question: string; garageId: string }) => {
      const { data } = await api.post<{ data: { conversationId: string; message: string } }>(
        '/chatbot/message',
        body,
      )
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chatbot'] })
    },
  })
}

export function useMyConversation(garageId: string | undefined) {
  return useQuery({
    queryKey: ['chatbot', 'my', garageId],
    enabled: Boolean(garageId),
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown> | null }>('/chatbot/my-conversation', {
        params: { garageId },
      })
      if (!data.data) return null
      return mapConversation(data.data)
    },
  })
}

export function useConversations() {
  return useQuery({
    queryKey: ['chatbot', 'conversations'],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/chatbot/conversations', {
        params: { limit: 50, page: 1 },
      })
      return data.data.map(mapConversation)
    },
  })
}

export function useManagerReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { conversationId: string; reponse: string }) => {
      const { data } = await api.post('/chatbot/manager-reply', body)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chatbot', 'conversations'] })
    },
  })
}
