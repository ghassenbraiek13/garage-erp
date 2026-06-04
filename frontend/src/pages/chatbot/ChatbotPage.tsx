import { Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import {
  useConversations,
  useManagerReply,
  type ApiConversation,
  type ChatMessage,
} from '@/hooks/api/useChatbot'
import { CHATBOT_DEMO_MODE, DEMO_CONVERSATIONS } from '@/data/chatbotDemo'
import { cn } from '@/lib/utils'

function clientName(conv: ApiConversation): string {
  const c = conv.clientId
  if (typeof c === 'object' && c?.name) return c.name
  return 'Client'
}

function lastPreview(conv: ApiConversation): string {
  const last = conv.messages[conv.messages.length - 1]
  return last?.contenu?.slice(0, 60) ?? '—'
}

function statutBadge(statut: ApiConversation['statut'], t: (k: string) => string) {
  const map = {
    open: { label: t('open'), className: 'bg-clay-green/15 text-clay-green border-clay-green/30' },
    pending_human: {
      label: t('pending'),
      className: 'bg-clay-orange/15 text-clay-orange border-clay-orange/30',
    },
    closed: { label: t('closed'), className: 'bg-zinc-500/15 text-ink-muted border-[var(--border)]' },
  }
  const s = map[statut] ?? map.open
  return (
    <Badge className={cn('border text-xs', s.className)} variant="outline">
      {s.label}
    </Badge>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isClient = msg.auteur === 'client'
  const isManager = msg.auteur === 'manager'
  return (
    <div
      className={cn(
        'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
        isClient && 'ms-auto bg-clay-primary text-white',
        !isClient && !isManager && 'me-auto bg-[var(--bg-sidebar)] text-ink-primary',
        isManager && 'me-auto bg-clay-green/20 text-ink-primary border border-clay-green/30',
      )}
    >
      {msg.contenu}
    </div>
  )
}

export function ChatbotPage() {
  const { t } = useTranslation('chatbot')
  const api = useConversations()
  const managerReply = useManagerReply()
  const [demoConversations, setDemoConversations] = useState<ApiConversation[]>(DEMO_CONVERSATIONS)
  const [selectedId, setSelectedId] = useState<string | null>(DEMO_CONVERSATIONS[0]?.id ?? null)
  const [reply, setReply] = useState('')

  const conversations = CHATBOT_DEMO_MODE ? demoConversations : (api.data ?? [])
  const isLoading = CHATBOT_DEMO_MODE ? false : api.isLoading
  const isError = CHATBOT_DEMO_MODE ? false : api.isError
  const error = CHATBOT_DEMO_MODE ? undefined : api.error
  const refetch = CHATBOT_DEMO_MODE ? async () => {} : api.refetch

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? conversations[0] ?? null,
    [conversations, selectedId],
  )

  useEffect(() => {
    if (!selectedId && conversations[0]) setSelectedId(conversations[0].id)
  }, [conversations, selectedId])

  const sendReply = async () => {
    if (!selected || !reply.trim()) return
    const text = reply.trim()

    if (CHATBOT_DEMO_MODE) {
      const managerMsg: ChatMessage = {
        auteur: 'manager',
        contenu: text,
        timestamp: new Date().toISOString(),
        type: 'human',
      }
      setDemoConversations((prev) =>
        prev.map((c) =>
          c.id === selected.id
            ? {
                ...c,
                statut: 'open',
                updatedAt: new Date().toISOString(),
                messages: [...c.messages, managerMsg],
              }
            : c,
        ),
      )
      setReply('')
      return
    }

    try {
      await managerReply.mutateAsync({ conversationId: selected.id, reponse: text })
      setReply('')
      void refetch()
    } catch {
      toast.error('Envoi impossible')
    }
  }

  return (
    <div className="space-y-3">
      {CHATBOT_DEMO_MODE ? (
        <p className="rounded-lg border border-clay-primary/30 bg-clay-primary/5 px-3 py-2 text-sm text-ink-secondary">
          Mode démo : conversations fictives pour la présentation. Le widget client répond aux mots-clés
          (rendez-vous, horaires, prix, etc.) sans appeler n8n.
        </p>
      ) : null}

      <div className="grid min-h-[70vh] grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <ClayCard variant="elevated" className="h-fit lg:max-h-[75vh] lg:overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-base">{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QueryBoundary
              isLoading={isLoading}
              isError={isError}
              error={error as Error}
              onRetry={() => void refetch()}
              isEmpty={!isLoading && conversations.length === 0}
              loading={<p className="text-sm text-ink-muted">…</p>}
              empty={<p className="text-sm text-ink-muted">{t('noConversations')}</p>}
            >
              {conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    'w-full rounded-2xl border px-3 py-2 text-start text-sm transition-colors',
                    selected?.id === c.id
                      ? 'border-clay-primary bg-clay-primary/10'
                      : 'border-[var(--border)] bg-[var(--bg-sidebar)] hover:bg-clay-primary/5',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink-primary">{clientName(c)}</span>
                    {statutBadge(c.statut, t)}
                  </div>
                  <p className="mt-1 truncate text-xs text-ink-muted">{lastPreview(c)}</p>
                  {c.updatedAt ? (
                    <p className="mt-1 text-[10px] text-ink-muted">
                      {new Date(c.updatedAt).toLocaleString('fr-FR')}
                    </p>
                  ) : null}
                </button>
              ))}
            </QueryBoundary>
          </CardContent>
        </ClayCard>

        <ClayCard variant="elevated" className="flex min-h-[60vh] flex-col">
          <CardHeader>
            <CardTitle className="text-base">
              {selected ? clientName(selected) : t('title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            {!selected ? (
              <p className="text-sm text-ink-muted">{t('noConversations')}</p>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-4 min-h-[320px]">
                  {selected.messages.map((m, i) => (
                    <MessageBubble key={`${m.timestamp}-${i}`} msg={m} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={t('placeholder')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        void sendReply()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="icon"
                    disabled={!CHATBOT_DEMO_MODE && managerReply.isPending}
                    onClick={() => void sendReply()}
                    aria-label={t('send')}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </ClayCard>
      </div>
    </div>
  )
}
