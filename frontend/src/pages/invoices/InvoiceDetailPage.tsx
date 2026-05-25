import { format, isPast } from 'date-fns'
import { arSA, fr } from 'date-fns/locale'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PayInvoiceModal } from '@/components/quotes/PayInvoiceModal'
import { QuoteLinesTable } from '@/components/quotes/QuoteLinesTable'
import { QuotePdfButtons } from '@/components/quotes/QuotePdfButtons'
import { QuoteRepairCard } from '@/components/quotes/QuoteRepairCard'
import { InvoiceStatusBadge } from '@/components/quotes/QuoteStatusBadge'
import { PageLoader } from '@/components/shared/PageLoader'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { useInvoice, useSendInvoiceEmail } from '@/hooks/api/useInvoices'
import { refIdStr, refLabel } from '@/lib/quoteUtils'
import { cn } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'

export function InvoiceDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation(['quotes', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const localeDate = locale === 'ar' ? arSA : fr

  const { data: invoice, isLoading, isError, error, refetch } = useInvoice(id)
  const sendEmail = useSendInvoiceEmail()
  const [payOpen, setPayOpen] = useState(false)

  const pdfName = invoice?.number ? `Facture-${invoice.number}` : `Facture-${invoice?.id ?? ''}`
  const status = invoice?.status ?? 'unpaid'
  const repairId = invoice ? refIdStr(invoice.repairId) || undefined : undefined
  const overdue =
    invoice?.dueDate && status !== 'paid' && isPast(new Date(invoice.dueDate))

  return (
    <div className="space-y-4">
      <Link to="/quotes" className="text-sm font-semibold text-clay-primary hover:underline">
        ← {t('quotes:backToInvoices')}
      </Link>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        onRetry={() => void refetch()}
        isEmpty={!invoice && !isLoading}
        empty={null}
        loading={<PageLoader />}
      >
        {invoice ? (
          <>
            <ClayCard variant="elevated">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {t('quotes:invoiceDetail')}
                  </p>
                  <CardTitle className="text-xl">{invoice.number ?? invoice.id.slice(-8)}</CardTitle>
                  <p className="mt-1 text-sm text-ink-secondary">{refLabel(invoice.clientId)}</p>
                  {invoice.vehicleId ? (
                    <p className="text-sm text-ink-secondary">{refLabel(invoice.vehicleId)}</p>
                  ) : null}
                  {invoice.createdAt ? (
                    <p className="text-xs text-ink-muted">
                      {t('quotes:issuedAt')}: {format(new Date(invoice.createdAt), 'PP', { locale: localeDate })}
                    </p>
                  ) : null}
                  {invoice.dueDate ? (
                    <p
                      className={cn(
                        'text-sm',
                        overdue ? 'font-semibold text-clay-red' : 'text-ink-secondary',
                      )}
                    >
                      {t('quotes:dueDate')}: {format(new Date(invoice.dueDate), 'PP', { locale: localeDate })}
                    </p>
                  ) : null}
                </div>
                <InvoiceStatusBadge status={status} />
              </CardHeader>
              <CardContent className="space-y-4">
                <QuoteRepairCard repairId={repairId} />
                <div className="flex flex-wrap gap-2">
                  {(status === 'unpaid' || status === 'overdue') && (
                    <Button type="button" onClick={() => setPayOpen(true)}>
                      {t('quotes:markPaid')}
                    </Button>
                  )}
                  {status === 'partial' && (
                    <Button type="button" onClick={() => setPayOpen(true)}>
                      {t('quotes:partialPayment')}
                    </Button>
                  )}
                  <QuotePdfButtons entity="invoices" id={invoice.id} fileName={pdfName} />
                  {(status === 'unpaid' || status === 'overdue' || status === 'paid') && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={sendEmail.isPending}
                      onClick={async () => {
                        try {
                          await sendEmail.mutateAsync(invoice.id)
                          toast.success(
                            status === 'paid' ? t('quotes:receiptSent') : t('quotes:emailSent'),
                          )
                        } catch {
                          toast.error(t('quotes:emailError'))
                        }
                      }}
                    >
                      {status === 'paid' ? t('quotes:sendReceipt') : t('quotes:sendEmail')}
                    </Button>
                  )}
                  {status === 'overdue' && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await sendEmail.mutateAsync(invoice.id)
                          toast.success(t('quotes:reminderSent'))
                        } catch {
                          toast.error(t('quotes:emailError'))
                        }
                      }}
                    >
                      {t('quotes:sendReminder')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </ClayCard>

            <ClayCard variant="elevated">
              <CardHeader>
                <CardTitle className="text-base">{t('quotes:lines')}</CardTitle>
              </CardHeader>
              <CardContent>
                <QuoteLinesTable
                  lines={invoice.lines ?? []}
                  subtotalHT={invoice.subtotalHT}
                  totalTVA={invoice.totalTVA}
                  totalDiscount={invoice.totalDiscount}
                  totalTTC={invoice.totalTTC}
                />
              </CardContent>
            </ClayCard>

            <PayInvoiceModal invoice={invoice} open={payOpen} onClose={() => setPayOpen(false)} />
          </>
        ) : null}
      </QueryBoundary>
    </div>
  )
}
