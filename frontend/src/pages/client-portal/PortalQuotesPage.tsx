import { format, isPast, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import axios from 'axios'
import { motion } from 'framer-motion'
import { FileText, RefreshCw, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useAcceptQuote,
  useApplyCouponToQuote,
  usePortalQuotes,
  useRefuseQuote,
  type PortalQuote,
} from '@/hooks/api/useQuotes'
import { cn } from '@/lib/utils'
import { formatTND } from '@/utils/currency'

type TabKey = 'sent' | 'accepted' | 'rejected' | 'all'

function statusBorder(status: PortalQuote['status']): string {
  switch (status) {
    case 'sent':
      return 'border-s-4 border-s-clay-primary'
    case 'accepted':
      return 'border-s-4 border-s-clay-green'
    case 'rejected':
      return 'border-s-4 border-s-red-400'
    case 'expired':
      return 'border-s-4 border-s-zinc-400'
    case 'invoiced':
      return 'border-s-4 border-s-clay-purple'
    default:
      return 'border-s-4 border-s-[var(--border)]'
  }
}

function statusLabel(status: PortalQuote['status']): string {
  const map: Record<string, string> = {
    sent: 'En attente',
    accepted: 'Accepté',
    rejected: 'Refusé',
    invoiced: 'Facturé',
    expired: 'Expiré',
    draft: 'Brouillon',
  }
  return map[status] ?? status
}

function ApplyCouponDialog({
  quote,
  open,
  onOpenChange,
}: {
  quote: PortalQuote | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { t } = useTranslation('clientPortal')
  const apply = useApplyCouponToQuote()
  const [code, setCode] = useState('')
  const [result, setResult] = useState<{ total: number; remise: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!quote || !code.trim()) return
    setError(null)
    setResult(null)
    try {
      const res = await apply.mutateAsync({ id: quote.id, couponCode: code.trim().toUpperCase() })
      setResult({ total: res.nouveauTotalTTC, remise: res.remiseAppliquee })
      toast.success(t('couponApplied'))
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : 'Coupon invalide'
      setError(msg)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) {
          setCode('')
          setResult(null)
          setError(null)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('applyCoupon')}</DialogTitle>
        </DialogHeader>
        {quote ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-secondary">
              Total actuel : <span className="font-semibold text-ink-primary">{formatTND(quote.totalTTC)}</span>
            </p>
            <div>
              <Label>Code coupon</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PROMO2026"
              />
            </div>
            {result ? (
              <div className="rounded-lg border border-clay-green/40 bg-clay-green/10 p-3 text-sm text-clay-green">
                Coupon appliqué ! Nouveau total : {formatTND(result.total)} — Remise : -{formatTND(result.remise)}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-lg border border-clay-red/40 bg-clay-red/10 p-3 text-sm text-clay-red">
                {error}
              </div>
            ) : null}
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="primary" disabled={apply.isPending} onClick={() => void submit()}>
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function QuoteCard({
  quote,
  index,
  onAccept,
  onRefuse,
  onCoupon,
}: {
  quote: PortalQuote
  index: number
  onAccept: () => void
  onRefuse: () => void
  onCoupon: () => void
}) {
  const expired = quote.validUntil ? isPast(parseISO(quote.validUntil)) : false
  const lines = quote.lines ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <ClayCard variant="elevated" className={cn(statusBorder(quote.status))}>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-ink-primary">{quote.number}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{statusLabel(quote.status)}</Badge>
              {quote.createdAt ? (
                <span className="text-xs text-ink-muted">
                  {format(parseISO(quote.createdAt), 'PP', { locale: fr })}
                </span>
              ) : null}
            </div>
          </div>

          {quote.vehicleInfo ? (
            <p className="text-sm text-ink-secondary">
              {[quote.vehicleInfo.plate, quote.vehicleInfo.make, quote.vehicleInfo.model]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}

          <ul className="space-y-1 text-sm text-ink-secondary">
            {lines.slice(0, 3).map((l, i) => (
              <li key={`${l.label}-${i}`} className="flex justify-between gap-2">
                <span className="truncate">{l.label}</span>
                <span className="shrink-0 font-medium">{formatTND(l.totalTTC ?? 0)}</span>
              </li>
            ))}
            {lines.length > 3 ? (
              <li className="text-xs text-ink-muted">+ {lines.length - 3} autres lignes</li>
            ) : null}
          </ul>

          <div className="flex flex-wrap gap-3 text-sm">
            <span>HT: {formatTND(quote.subtotalHT)}</span>
            <span>TVA: {formatTND(quote.totalTVA)}</span>
            <span className="text-base font-bold text-ink-primary">TTC: {formatTND(quote.totalTTC)}</span>
          </div>

          {quote.validUntil ? (
            <p className={cn('text-xs', expired ? 'font-semibold text-clay-red' : 'text-ink-muted')}>
              Valide jusqu&apos;au {format(parseISO(quote.validUntil), 'PP', { locale: fr })}
            </p>
          ) : null}

          {quote.status === 'accepted' ? (
            <div className="rounded-lg border border-clay-primary/30 bg-clay-primary/10 p-3 text-sm text-ink-primary">
              ✓ Devis accepté — Notre équipe prépare votre facture. Vous recevrez une notification dès
              qu&apos;elle sera disponible.
            </div>
          ) : null}

          {quote.status === 'invoiced' ? (
            <div className="rounded-lg border border-clay-purple/30 bg-clay-purple/10 p-3 text-sm text-ink-primary">
              📄 Une facture a été générée pour ce devis. Consultez l&apos;onglet Factures.
            </div>
          ) : null}

          {quote.status === 'sent' ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" variant="green" size="sm" onClick={onAccept}>
                Accepter le devis
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-clay-red hover:text-clay-red"
                onClick={onRefuse}
              >
                Refuser
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={onCoupon}>
                <Tag className="h-4 w-4" />
                Appliquer un coupon
              </Button>
            </div>
          ) : null}

          {quote.status === 'accepted' ? (
            <Button type="button" variant="secondary" size="sm" onClick={onCoupon}>
              <Tag className="h-4 w-4" />
              Appliquer un coupon
            </Button>
          ) : null}
        </CardContent>
      </ClayCard>
    </motion.div>
  )
}

export function PortalQuotesPage(): React.ReactElement {
  const { t } = useTranslation('clientPortal')
  const { data: quotes = [], isLoading, isError, error, refetch } = usePortalQuotes()
  const acceptQuote = useAcceptQuote()
  const refuseQuote = useRefuseQuote()

  const [tab, setTab] = useState<TabKey>('sent')
  const [confirm, setConfirm] = useState<{ type: 'accept' | 'refuse'; quote: PortalQuote } | null>(null)
  const [couponQuote, setCouponQuote] = useState<PortalQuote | null>(null)

  const filtered = useMemo(() => {
    if (tab === 'all') return quotes
    return quotes.filter((q) => q.status === tab)
  }, [quotes, tab])

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'sent', label: 'En attente' },
    { key: 'accepted', label: 'Acceptés' },
    { key: 'rejected', label: 'Refusés' },
    { key: 'all', label: 'Tous' },
  ]

  const runConfirm = async () => {
    if (!confirm) return
    try {
      if (confirm.type === 'accept') {
        await acceptQuote.mutateAsync(confirm.quote.id)
        toast.success(t('quoteAccepted'))
      } else {
        await refuseQuote.mutateAsync(confirm.quote.id)
        toast.success(t('quoteRefused'))
      }
      setConfirm(null)
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : 'Action impossible'
      toast.error(msg)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-[var(--radius-card)] bg-[var(--bg-sidebar)]" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-ink-secondary">{(error as Error)?.message}</p>
        <Button type="button" variant="secondary" className="gap-2" onClick={() => void refetch()}>
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-primary">
          <FileText className="h-7 w-7 text-clay-primary" />
          {t('quotes')}
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Consultez, acceptez ou refusez vos devis
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <Button
            key={tb.key}
            type="button"
            size="sm"
            variant={tab === tb.key ? 'primary' : 'secondary'}
            onClick={() => setTab(tb.key)}
          >
            {tb.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <FileText className="h-12 w-12 text-ink-muted" />
          <p className="font-medium text-ink-primary">{t('noQuotes')}</p>
          <p className="max-w-sm text-sm text-ink-secondary">
            Vos devis apparaîtront ici une fois envoyés par notre équipe.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q, i) => (
            <QuoteCard
              key={q.id}
              quote={q}
              index={i}
              onAccept={() => setConfirm({ type: 'accept', quote: q })}
              onRefuse={() => setConfirm({ type: 'refuse', quote: q })}
              onCoupon={() => setCouponQuote(q)}
            />
          ))}
        </div>
      )}

      <Dialog open={Boolean(confirm)} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.type === 'accept' ? t('confirmAccept') : t('confirmRefuse')}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-ink-secondary">
            {confirm?.type === 'accept'
              ? 'Êtes-vous sûr de vouloir accepter ce devis ? Notre équipe sera notifiée et préparera votre facture.'
              : 'Êtes-vous sûr de vouloir refuser ce devis ?'}
          </p>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setConfirm(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant={confirm?.type === 'accept' ? 'green' : 'danger'}
              disabled={acceptQuote.isPending || refuseQuote.isPending}
              onClick={() => void runConfirm()}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApplyCouponDialog
        quote={couponQuote}
        open={Boolean(couponQuote)}
        onOpenChange={(o) => !o && setCouponQuote(null)}
      />
    </div>
  )
}
