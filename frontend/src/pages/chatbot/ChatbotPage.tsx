import { Paperclip, Send, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

type Msg = { id: string; role: 'user' | 'assistant'; text: string }

export function ChatbotPage() {
  const { t } = useTranslation('chatbot')
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'm1', role: 'assistant', text: 'Bonjour ! Décrivez les symptômes ou envoyez une photo.' },
  ])

  const convos = useMemo(
    () => [
      { id: 'c1', title: 'Bruit à froid' },
      { id: 'c2', title: 'Voyant moteur' },
    ],
    [],
  )

  const send = async () => {
    if (!text.trim()) return
    const user: Msg = { id: `u-${Date.now()}`, role: 'user', text }
    setMessages((m) => [...m, user])
    setText('')
    setTyping(true)
    await new Promise((r) => setTimeout(r, 900))
    setTyping(false)
    setMessages((m) => [
      ...m,
      { id: `a-${Date.now()}`, role: 'assistant', text: 'Analyse IA (démo) : vérifiez bougies et débitmètre.' },
    ])
  }

  return (
    <div className="grid min-h-[70vh] grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      <ClayCard variant="elevated" className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">{t('history')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {convos.map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-3 py-2 text-start text-sm font-semibold"
            >
              {c.title}
            </button>
          ))}
        </CardContent>
      </ClayCard>

      <ClayCard variant="elevated" className="border-clay-purple/30 bg-gradient-to-br from-clay-purple/10 via-transparent to-transparent">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-clay-purple/15 text-clay-purple">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{t('title')}</CardTitle>
              <p className="text-xs text-ink-secondary">{t('powered')}</p>
            </div>
          </div>
          <Badge variant="purple">IA</Badge>
        </CardHeader>
        <CardContent className="flex h-full flex-col gap-4">
          <div className="flex-1 space-y-3 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-4">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={m.role === 'user' ? 'ms-auto max-w-[85%] rounded-2xl bg-clay-primary px-3 py-2 text-sm text-white' : 'me-auto max-w-[85%] rounded-2xl bg-[var(--bg-sidebar)] px-3 py-2 text-sm text-ink-primary'}
              >
                {m.text}
              </motion.div>
            ))}
            {typing ? (
              <div className="flex items-center gap-1 ps-2 text-sm text-ink-muted">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-clay-purple" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-clay-purple [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-clay-purple [animation-delay:240ms]" />
                </span>
                IA…
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {['Fuite liquide', 'Bruit train AV', 'Voyant ABS'].map((s) => (
              <Button key={s} size="sm" variant="secondary" type="button" onClick={() => setText(s)}>
                {s}
              </Button>
            ))}
          </div>

          <div className="flex items-end gap-2">
            <Button size="icon" variant="secondary" type="button" aria-label="Pièce jointe">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('placeholder')} />
            <Button size="icon" type="button" variant="purple" onClick={() => void send()} aria-label="Envoyer">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </ClayCard>
    </div>
  )
}
