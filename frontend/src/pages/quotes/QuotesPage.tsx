import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataColumn } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { useInvoicesList, type ApiInvoice } from '@/hooks/api/useInvoices'
import { useQuotesList, type ApiQuote } from '@/hooks/api/useQuotes'
import { formatCurrencyEUR } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'
import api from '@/utils/api'

const lineSchema = z.object({
  label: z.string().min(2),
  qty: z.coerce.number().min(1),
  unit: z.coerce.number().min(0),
  tva: z.coerce.number().min(0),
})

const quoteFormSchema = z.object({
  lines: z.array(lineSchema).min(1),
  discount: z.coerce.number().min(0),
})

export function QuotesPage(): React.ReactElement {
  const { t } = useTranslation(['quotes', 'common'])
  const locale = useLocaleStore((s) => s.locale)
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

  const form = useForm<z.infer<typeof quoteFormSchema>>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      discount: 0,
      lines: [{ label: 'Main d’œuvre', qty: 1, unit: 85, tva: 20 }],
    },
  })

  const watchedLines = form.watch('lines')
  const watchedDiscount = form.watch('discount')
  const totals = useMemo(() => {
    const ht = watchedLines.reduce((s, l) => s + l.qty * l.unit, 0)
    const tvaAmt = watchedLines.reduce((s, l) => s + l.qty * l.unit * (l.tva / 100), 0)
    const ttc = ht + tvaAmt - watchedDiscount
    return { ht, tvaAmt, ttc }
  }, [watchedDiscount, watchedLines])

  const quoteColumns: DataColumn<ApiQuote>[] = [
    { id: 'id', header: 'ID', cell: (q) => <span className="font-mono text-xs">{q.id.slice(-8)}</span> },
    {
      id: 'total',
      header: 'Total TTC',
      cell: (q) => formatCurrencyEUR(q.totalTTC ?? 0, locale),
    },
    {
      id: 'status',
      header: t('quotes:pipeline'),
      cell: (q) => (
        <Badge variant="primary" className="capitalize">
          {q.status}
        </Badge>
      ),
    },
    {
      id: 'pdf',
      header: <span className="text-end">{t('common:actions')}</span>,
      headerClassName: 'text-end',
      cellClassName: 'text-end',
      cell: (q) => (
        <Button
          size="sm"
          variant="secondary"
          type="button"
          onClick={async () => {
            try {
              const res = await api.get(`/quotes/${q.id}/pdf`, { responseType: 'blob' })
              const url = URL.createObjectURL(res.data as Blob)
              window.open(url, '_blank', 'noopener')
            } catch {
              /* ignore */
            }
          }}
        >
          {t('quotes:previewPdf')}
        </Button>
      ),
    },
  ]

  const invColumns: DataColumn<ApiInvoice>[] = [
    { id: 'id', header: 'ID', cell: (x) => <span className="font-mono text-xs">{x.id.slice(-8)}</span> },
    { id: 'ttc', header: 'Total TTC', cell: (x) => formatCurrencyEUR(x.totalTTC ?? 0, locale) },
    {
      id: 'st',
      header: 'Statut',
      cell: (x) => (
        <Badge variant={x.status === 'paid' ? 'success' : 'warning'} className="capitalize">
          {x.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-fluid-h1 font-semibold">{t('quotes:title')}</h1>
        <p className="text-sm text-ink-secondary">Devis et factures (API)</p>
      </div>

      <Tabs defaultValue="quotes">
        <TabsList>
          <TabsTrigger value="quotes">{t('quotes:quotes')}</TabsTrigger>
          <TabsTrigger value="invoices">{t('quotes:invoices')}</TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-4">
          <ClayCard variant="elevated">
            <CardHeader>
              <CardTitle className="text-base">Liste des devis</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryBoundary
                isLoading={qLoading}
                isError={qErr}
                error={qError as Error}
                onRetry={() => void refetchQ()}
                isEmpty={!qLoading && quotes.length === 0}
                loading={<TableSkeleton rows={5} />}
                empty={<p className="text-sm text-ink-muted">Aucun devis</p>}
              >
                <DataTable columns={quoteColumns} data={quotes} getRowKey={(q) => q.id} />
              </QueryBoundary>
            </CardContent>
          </ClayCard>

          <ClayCard variant="elevated">
            <CardHeader>
              <CardTitle className="text-base">Nouveau devis (calcul TVA)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch('lines').map((_, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <Label>{t('quotes:lines')}</Label>
                    <Input {...form.register(`lines.${idx}.label` as const)} />
                  </div>
                  <div>
                    <Label>{t('quotes:qty')}</Label>
                    <Input type="number" {...form.register(`lines.${idx}.qty` as const)} />
                  </div>
                  <div>
                    <Label>{t('quotes:unit')}</Label>
                    <Input type="number" {...form.register(`lines.${idx}.unit` as const)} />
                  </div>
                  <div>
                    <Label>{t('quotes:tva')} %</Label>
                    <Input type="number" {...form.register(`lines.${idx}.tva` as const)} />
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <Label>{t('quotes:discount')} (€)</Label>
                  <Input type="number" {...form.register('discount')} />
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3 text-sm">
                  <p>
                    HT : <span className="font-semibold">{formatCurrencyEUR(totals.ht, locale)}</span>
                  </p>
                  <p>
                    TVA : <span className="font-semibold">{formatCurrencyEUR(totals.tvaAmt, locale)}</span>
                  </p>
                  <p>
                    TTC : <span className="font-semibold">{formatCurrencyEUR(totals.ttc, locale)}</span>
                  </p>
                </div>
              </div>
              <Button type="button" onClick={() => form.handleSubmit(() => undefined)()}>
                {t('common:save')}
              </Button>
            </CardContent>
          </ClayCard>
        </TabsContent>

        <TabsContent value="invoices">
          <ClayCard variant="elevated">
            <CardHeader>
              <CardTitle className="text-base">{t('quotes:invoices')}</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryBoundary
                isLoading={iLoading}
                isError={iErr}
                error={iError as Error}
                onRetry={() => void refetchI()}
                isEmpty={!iLoading && invoices.length === 0}
                loading={<TableSkeleton rows={5} />}
                empty={<p className="text-sm text-ink-muted">Aucune facture</p>}
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
