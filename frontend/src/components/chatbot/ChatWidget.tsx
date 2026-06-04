import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMyConversation, useSendMessage, type ChatMessage } from '@/hooks/api/useChatbot'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { connectSocket, getSocket } from '@/utils/socket'
import {
  CHATBOT_DEMO_MODE,
  createDemoBotMessage,
  createDemoClientMessage,
  DEMO_SUGGESTED_PROMPTS,
  matchDemoReply,
} from '@/data/chatbotDemo'

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isClient = msg.auteur === 'client'
  return (
    <div
      className={cn(
        'max-w-[90%] rounded-2xl px-3 py-2 text-sm',
        isClient ? 'ms-auto bg-clay-primary text-white' : 'me-auto bg-[var(--bg-sidebar)] text-ink-primary',
      )}
    >
      {msg.contenu}
    </div>
  )
}

const WELCOME_BOT: ChatMessage = {
  auteur: 'bot',
  contenu:
    'Bonjour ! Je suis l’assistant GarageFlow (mode démo). Essayez : rendez-vous, horaires, prix, facture, coupon ou adresse.',
  timestamp: new Date().toISOString(),
  type: 'bot',
}

export function ChatWidget() {
  const { t } = useTranslation('chatbot')
  const user = useAuthStore((s) => s.user)
  const garageId = user?.garageId ?? undefined
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(
    CHATBOT_DEMO_MODE ? [WELCOME_BOT] : [],
  )
  const [typing, setTyping] = useState(false)

  const { data: conversation, refetch } = useMyConversation(
    CHATBOT_DEMO_MODE ? undefined : garageId,
  )
  const sendMessage = useSendMessage()

  useEffect(() => {
    if (CHATBOT_DEMO_MODE || !conversation?.messages) return
    setLocalMessages(conversation.messages)
  }, [conversation])

  useEffect(() => {
    if (CHATBOT_DEMO_MODE || !user?.clientId || user.role !== 'client') return
    connectSocket()
    const socket = getSocket()
    socket.emit('join:client', user.clientId)

    const handler = (payload: { reponse: string; auteur?: string; type?: string }) => {
      setLocalMessages((prev) => [
        ...prev,
        {
          auteur: payload.auteur === 'manager' ? 'manager' : 'bot',
          contenu: payload.reponse,
          timestamp: new Date().toISOString(),
          type: (payload.type as 'bot' | 'human') ?? 'bot',
        },
      ])
      void refetch()
    }

    socket.on('chatbot:reply', handler)
    return () => {
      socket.off('chatbot:reply', handler)
    }
  }, [user?.clientId, user?.role, refetch])

  if (!user || user.role !== 'client') return null
  if (!CHATBOT_DEMO_MODE && !garageId) return null

  const pushQuestion = async (question: string) => {
    const trimmed = question.trim()
    if (!trimmed) return

    setLocalMessages((prev) => [...prev, createDemoClientMessage(trimmed)])
    setText('')

    if (CHATBOT_DEMO_MODE) {
      setTyping(true)
      await new Promise((r) => setTimeout(r, 700))
      const { contenu } = matchDemoReply(trimmed)
      setLocalMessages((prev) => [...prev, createDemoBotMessage(contenu)])
      setTyping(false)
      return
    }

    if (!garageId) return
    await sendMessage.mutateAsync({ question: trimmed, garageId })
    void refetch()
  }

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center',
            'rounded-full bg-clay-primary text-white shadow-lg',
            'hover:opacity-90 transition-opacity',
          )}
          aria-label={t('assistantTitle')}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      ) : (
        <div
          className={cn(
            'fixed bottom-6 end-6 z-50 flex w-[380px] flex-col overflow-hidden',
            'rounded-[var(--radius-card)] border border-[var(--border)]',
            'bg-[var(--bg-surface)] shadow-xl',
          )}
          style={{ height: 520 }}
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-clay-primary px-4 py-3 text-white">
            <div>
              <span className="text-sm font-semibold">{t('assistantTitle')}</span>
              {CHATBOT_DEMO_MODE ? (
                <p className="text-[10px] opacity-80"></p>
              ) : null}
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {localMessages.length === 0 && !typing ? (
              <p className="text-center text-sm text-ink-muted">{t('placeholder')}</p>
            ) : (
              localMessages.map((m, i) => <MessageBubble key={`${m.timestamp}-${i}`} msg={m} />)
            )}
            {typing ? (
              <p className="text-xs text-ink-muted animate-pulse">L’assistant écrit…</p>
            ) : null}
          </div>
          {CHATBOT_DEMO_MODE ? (
            <div className="flex flex-wrap gap-1 border-t border-[var(--border)] px-3 py-2">
              {DEMO_SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full border border-[var(--border)] bg-[var(--bg-sidebar)] px-2 py-0.5 text-[10px] text-ink-secondary hover:bg-clay-primary/10"
                  onClick={() => void pushQuestion(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex gap-2 border-t border-[var(--border)] p-3">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('placeholder')}
              disabled={typing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void pushQuestion(text)
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="primary"
              disabled={typing || (!CHATBOT_DEMO_MODE && sendMessage.isPending)}
              onClick={() => void pushQuestion(text)}
              aria-label={t('send')}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
