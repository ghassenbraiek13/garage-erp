import { format, isPast, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { Receipt, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent } from '@/components/ui/card'
import { usePortalInvoices, type PortalInvoice } from '@/hooks/api/useInvoices'
import { cn } from '@/lib/utils'
import { formatTND } from '@/utils/currency'

type TabKey = 'unpaid' | 'paid' | 'all'

function statusBorder(status: PortalInvoice['status']): string {
  switch (status) {
    case 'unpaid':
      return 'border-s-4 border-s-clay-red'
    case 'partial':
      return 'border-s-4 border-s-clay-orange'
    case 'paid':
      return 'border-s-4 border-s-clay-green'
    case 'overdue':
      return 'border-s-4 border-s-red-600'
    default:
      return 'border-s-4 border-s-[var(--border)]'
  }
}

function statusBadgeClass(status: PortalInvoice['status']): string {
  switch (status) {
    case 'unpaid':
      return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
    case 'partial':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
    case 'paid':
      return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
    case 'overdue':
      return 'bg-red-200 font-bold text-red-800 dark:bg-red-950/60 dark:text-red-200'
    default:
      return ''
  }
}

function statusLabel(status: PortalInvoice['status']): string {
  const map: Record<string, string> = {
    unpaid: 'Non payée',
    partial: 'Partielle',
    paid: 'Payée',
    overdue: 'En retard',
    cancelled: 'Annulée',
  }
  return map[status] ?? status
}

function InvoiceCard({ invoice, index }: { invoice: PortalInvoice; index: number }) {
  const overdue =
    invoice.dueDate &&
    ['unpaid', 'partial', 'overdue'].includes(invoice.status) &&
    isPast(parseISO(invoice.dueDate))
  const lines = invoice.lines ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <ClayCard variant="elevated" className={cn(statusBorder(invoice.status))}>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-ink-primary">{invoice.number}</span>
            <div className="flex items-center gap-2">
              <Badge className={cn('border-0', statusBadgeClass(invoice.status))}>
                {statusLabel(invoice.status)}
              </Badge>
              {invoice.createdAt ? (
                <span className="text-xs text-ink-muted">
                  {format(parseISO(invoice.createdAt), 'PP', { locale: fr })}
                </span>
              ) : null}
            </div>
          </div>

          {invoice.vehicleInfo ? (
            <p className="text-sm text-ink-secondary">
              {[invoice.vehicleInfo.plate, invoice.vehicleInfo.make, invoice.vehicleInfo.model]
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
            <span>HT: {formatTND(invoice.subtotalHT)}</span>
            <span className="text-base font-bold text-ink-primary">TTC: {formatTND(invoice.totalTTC)}</span>
          </div>

          {invoice.status === 'paid' && invoice.paidAt ? (
            <p className="text-sm text-ink-secondary">
              Payée le {format(parseISO(invoice.paidAt), 'PP', { locale: fr })}
              {invoice.paymentMethod ? (
                <Badge variant="outline" className="ms-2 text-xs capitalize">
                  {invoice.paymentMethod}
                </Badge>
              ) : null}
            </p>
          ) : invoice.dueDate ? (
            <p className={cn('text-sm', overdue ? 'font-semibold text-clay-red' : 'text-ink-muted')}>
              Échéance : {format(parseISO(invoice.dueDate), 'PP', { locale: fr })}
            </p>
          ) : null}
        </CardContent>
      </ClayCard>
    </motion.div>
  )
}

export function PortalInvoicesPage(): React.ReactElement {
  const { t } = useTranslation('clientPortal')
  const { data: invoices = [], isLoading, isError, error, refetch } = usePortalInvoices()
  const [tab, setTab] = useState<TabKey>('unpaid')

  const filtered = useMemo(() => {
    if (tab === 'all') return invoices
    if (tab === 'paid') return invoices.filter((i) => i.status === 'paid')
    return invoices.filter((i) => ['unpaid', 'partial', 'overdue'].includes(i.status))
  }, [invoices, tab])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-[var(--radius-card)] bg-[var(--bg-sidebar)]" />
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
          <Receipt className="h-7 w-7 text-clay-primary" />
          {t('invoices')}
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'unpaid' as const, label: 'Non payées' },
            { key: 'paid' as const, label: 'Payées' },
            { key: 'all' as const, label: 'Toutes' },
          ] as const
        ).map((tb) => (
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
          <Receipt className="h-12 w-12 text-ink-muted" />
          <p className="font-medium text-ink-primary">{t('noInvoices')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((inv, i) => (
            <InvoiceCard key={inv.id} invoice={inv} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
