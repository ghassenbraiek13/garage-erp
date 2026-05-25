import { format, isPast, startOfMonth } from 'date-fns'
import { arSA, fr } from 'date-fns/locale'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataColumn } from '@/components/ui/DataTable'
import { QuoteCreateModal } from '@/components/quotes/QuoteCreateModal'
import { QuotePdfButtons } from '@/components/quotes/QuotePdfButtons'
import { InvoiceStatusBadge, QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { useInvoicesList, type ApiInvoice } from '@/hooks/api/useInvoices'
import { useQuotesList, type ApiQuote } from '@/hooks/api/useQuotes'
import { refLabel } from '@/lib/quoteUtils'
import { cn, formatCurrencyEUR } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'

function SummaryCard({
  label,
  value,
  hint,
  danger,
}: {
  label: string
  value: string
  hint?: string
  danger?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-4 shadow-clay">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={cn('mt-1 text-xl font-bold', danger ? 'text-clay-red' : 'text-ink-primary')}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-secondary">{hint}</p> : null}
    </div>
  )
}

export function QuotesPage(): React.ReactElement {
  const { t } = useTranslation(['quotes', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const localeDate = locale === 'ar' ? arSA : fr
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setCreateOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const {
    data: quotesData,
    isLoading: qLoading,
    isError: qErr,
    error: qError,
    refetch: refetchQ,
  } = useQuotesList()
  const {
    data: invData,
    isLoading: iLoading,
    isError: iErr,
    error: iError,
    refetch: refetchI,
  } = useInvoicesList()

  const quotes = quotesData?.items ?? []
  const invoices = invData?.items ?? []
  const monthStart = startOfMonth(new Date())

  const quoteStats = useMemo(() => {
    const monthQuotes = quotes.filter((q) => q.createdAt && new Date(q.createdAt) >= monthStart)
    const sent = quotes.filter((q) => q.status === 'sent').length
    const accepted = quotes.filter((q) => q.status === 'accepted').length
    const total = quotes.length
    const rate = total > 0 ? Math.round((accepted / total) * 100) : 0
    return { month: monthQuotes.length, sent, accepted, rate }
  }, [quotes, monthStart])

  const invoiceStats = useMemo(() => {
    const monthInv = invoices.filter((i) => i.createdAt && new Date(i.createdAt) >= monthStart)
    const paid = monthInv.filter((i) => i.status === 'paid')
    const pending = invoices.filter((i) => i.status === 'unpaid' || i.status === 'partial')
    const overdue = invoices.filter(
      (i) =>
        (i.status === 'unpaid' || i.status === 'overdue') &&
        i.dueDate &&
        isPast(new Date(i.dueDate)),
    )
    const collected = paid.reduce((s, i) => s + (i.totalTTC ?? 0), 0)
    const waiting = pending.reduce((s, i) => s + (i.totalTTC ?? 0), 0)
    return {
      monthCount: monthInv.length,
      collected,
      waiting,
      overdueCount: overdue.length,
    }
  }, [invoices, monthStart])

  const quoteColumns: DataColumn<ApiQuote>[] = [
    {
      id: 'number',
      header: t('quotes:colNumber'),
      cell: (q) => (
        <Link to={`/quotes/${q.id}`} className="font-mono text-sm font-semibold text-clay-primary hover:underline">
          {q.number ?? q.id.slice(-8)}
        </Link>
      ),
    },
    { id: 'client', header: t('quotes:colClient'), cell: (q) => refLabel(q.clientId) },
    { id: 'vehicle', header: t('quotes:colVehicle'), cell: (q) => refLabel(q.vehicleId) },
    {
      id: 'total',
      header: t('quotes:colAmount'),
      cell: (q) => formatCurrencyEUR(q.totalTTC ?? 0, locale),
    },
    {
      id: 'status',
      header: t('quotes:colStatus'),
      cell: (q) => <QuoteStatusBadge status={q.status} />,
    },
    {
      id: 'valid',
      header: t('quotes:colValidity'),
      cell: (q) =>
        q.validUntil ? format(new Date(q.validUntil), 'PP', { locale: localeDate }) : '—',
    },
    {
      id: 'actions',
      header: <span className="text-end">{t('common:actions')}</span>,
      headerClassName: 'text-end',
      cellClassName: 'text-end',
      cell: (q) => (
        <div className="flex flex-wrap justify-end gap-1">
          <Button size="sm" variant="secondary" asChild>
            <Link to={`/quotes/${q.id}`}>{t('common:view')}</Link>
          </Button>
          <QuotePdfButtons
            entity="quotes"
            id={q.id}
            fileName={q.number ? `Devis-${q.number}` : `Devis-${q.id}`}
            size="sm"
          />
          {(q.status === 'draft' || q.status === 'sent') && (
            <Button size="sm" variant="secondary" onClick={() => navigate(`/quotes/${q.id}`)}>
              {t('common:edit')}
            </Button>
          )}
          {q.status === 'accepted' && (
            <Button size="sm" className="bg-clay-green text-white hover:opacity-90" onClick={() => navigate(`/quotes/${q.id}`)}>
              {t('quotes:convert')}
            </Button>
          )}
        </div>
      ),
    },
  ]

  const invColumns: DataColumn<ApiInvoice>[] = [
    {
      id: 'number',
      header: t('quotes:colNumber'),
      cell: (x) => (
        <Link to={`/invoices/${x.id}`} className="font-mono text-sm font-semibold text-clay-primary hover:underline">
          {x.number ?? x.id.slice(-8)}
        </Link>
      ),
    },
    { id: 'client', header: t('quotes:colClient'), cell: (x) => refLabel(x.clientId) },
    { id: 'vehicle', header: t('quotes:colVehicle'), cell: (x) => refLabel(x.vehicleId) },
    { id: 'ttc', header: t('quotes:colAmount'), cell: (x) => formatCurrencyEUR(x.totalTTC ?? 0, locale) },
    { id: 'st', header: t('quotes:colStatus'), cell: (x) => <InvoiceStatusBadge status={x.status} /> },
    {
      id: 'due',
      header: t('quotes:dueDate'),
      cell: (x) => {
        if (!x.dueDate) return '—'
        const overdue = (x.status === 'unpaid' || x.status === 'overdue') && isPast(new Date(x.dueDate))
        return (
          <span className={cn(overdue && 'font-semibold text-clay-red')}>
            {format(new Date(x.dueDate), 'PP', { locale: localeDate })}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: <span className="text-end">{t('common:actions')}</span>,
      headerClassName: 'text-end',
      cellClassName: 'text-end',
      cell: (x) => (
        <div className="flex flex-wrap justify-end gap-1">
          <Button size="sm" variant="secondary" asChild>
            <Link to={`/invoices/${x.id}`}>{t('common:view')}</Link>
          </Button>
          <QuotePdfButtons
            entity="invoices"
            id={x.id}
            fileName={x.number ? `Facture-${x.number}` : `Facture-${x.id}`}
            size="sm"
          />
          {(x.status === 'unpaid' || x.status === 'overdue') && (
            <Button size="sm" variant="secondary" asChild>
              <Link to={`/invoices/${x.id}`}>{t('quotes:markPaid')}</Link>
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-fluid-h1 font-semibold">{t('quotes:title')}</h1>
          <p className="text-sm text-ink-secondary">{t('quotes:subtitle')}</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          {t('quotes:newQuote')}
        </Button>
      </div>

      <QuoteCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <Tabs defaultValue="quotes">
        <TabsList>
          <TabsTrigger value="quotes">{t('quotes:quotes')}</TabsTrigger>
          <TabsTrigger value="invoices">{t('quotes:invoices')}</TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard label={t('quotes:statMonthQuotes')} value={String(quoteStats.month)} />
            <SummaryCard label={t('quotes:statPending')} value={String(quoteStats.sent)} />
            <SummaryCard label={t('quotes:statAccepted')} value={String(quoteStats.accepted)} />
            <SummaryCard
              label={t('quotes:statConversion')}
              value={`${quoteStats.rate}%`}
              hint={t('quotes:statConversionHint')}
            />
          </div>

          <ClayCard variant="elevated">
            <CardHeader>
              <CardTitle className="text-base">{t('quotes:quotesList')}</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryBoundary
                isLoading={qLoading}
                isError={qErr}
                error={qError as Error}
                onRetry={() => void refetchQ()}
                isEmpty={!qLoading && quotes.length === 0}
                loading={<TableSkeleton rows={6} />}
                empty={<p className="text-sm text-ink-muted">{t('quotes:emptyQuotes')}</p>}
              >
                <DataTable columns={quoteColumns} data={quotes} getRowKey={(q) => q.id} />
              </QueryBoundary>
            </CardContent>
          </ClayCard>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard label={t('quotes:statMonthInvoices')} value={String(invoiceStats.monthCount)} />
            <SummaryCard
              label={t('quotes:statCollected')}
              value={formatCurrencyEUR(invoiceStats.collected, locale)}
            />
            <SummaryCard label={t('quotes:statWaiting')} value={formatCurrencyEUR(invoiceStats.waiting, locale)} />
            <SummaryCard
              label={t('quotes:statOverdue')}
              value={String(invoiceStats.overdueCount)}
              danger={invoiceStats.overdueCount > 0}
            />
          </div>

          <ClayCard variant="elevated">
            <CardHeader>
              <CardTitle className="text-base">{t('quotes:invoicesList')}</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryBoundary
                isLoading={iLoading}
                isError={iErr}
                error={iError as Error}
                onRetry={() => void refetchI()}
                isEmpty={!iLoading && invoices.length === 0}
                loading={<TableSkeleton rows={6} />}
                empty={<p className="text-sm text-ink-muted">{t('quotes:emptyInvoices')}</p>}
              >
                <DataTable columns={invColumns} data={invoices} getRowKey={(x) => x.id} />
              </QueryBoundary>
            </CardContent>
          </ClayCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
