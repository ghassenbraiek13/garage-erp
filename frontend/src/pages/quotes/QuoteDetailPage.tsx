import { format } from 'date-fns'
import { arSA, fr } from 'date-fns/locale'
import axios from 'axios'
import { ArrowRightLeft, Loader2, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { QuoteEditModal } from '@/components/quotes/QuoteEditModal'
import { QuoteLinesTable } from '@/components/quotes/QuoteLinesTable'
import { QuotePdfButtons } from '@/components/quotes/QuotePdfButtons'
import { QuoteRepairCard } from '@/components/quotes/QuoteRepairCard'
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge'
import { QuoteWorkflowStepper } from '@/components/quotes/QuoteWorkflowStepper'
import { PageLoader } from '@/components/shared/PageLoader'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import {
  useConvertQuote,
  useDeleteQuote,
  usePatchQuoteStatus,
  useQuote,
  useSendQuoteEmail,
} from '@/hooks/api/useQuotes'
import { useInvoicesList } from '@/hooks/api/useInvoices'
import { refIdStr, refLabel, stripRepairMarker } from '@/lib/quoteUtils'
import { formatTND } from '@/utils/currency'
import { useLocaleStore } from '@/store/locale'
import api from '@/utils/api'

export function QuoteDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['quotes', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const localeDate = locale === 'ar' ? arSA : fr

  const { data: quote, isLoading, isError, error, refetch } = useQuote(id)
  const { data: invoicesData } = useInvoicesList()
  const patchStatus = usePatchQuoteStatus()
  const convertMut = useConvertQuote()
  const deleteMut = useDeleteQuote()
  const sendEmail = useSendQuoteEmail()

  const [editOpen, setEditOpen] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)

  const linkedInvoice = useMemo(() => {
    if (!quote) return undefined
    return (invoicesData?.items ?? []).find((inv) => refIdStr(inv.quoteId) === quote.id)
  }, [invoicesData, quote])

  const pdfName = quote?.number ? `Devis-${quote.number}` : `Devis-${quote?.id ?? ''}`
  const status = quote?.status ?? 'draft'
  const canEdit = status === 'draft' || status === 'sent' || status === 'rejected'
  const canConvert = status === 'accepted'
  const displayNotes = quote?.notes ? stripRepairMarker(quote.notes) : ''

  const handleSend = async () => {
    if (!quote) return
    try {
      await sendEmail.mutateAsync(quote.id)
      toast.success(t('quotes:sendSuccess'))
    } catch {
      try {
        await patchStatus.mutateAsync({ id: quote.id, status: 'sent' })
        toast.success(t('quotes:sendSuccess'))
      } catch {
        toast.error(t('quotes:sendError'))
      }
    }
  }

  const handleConvert = async () => {
    if (!quote) return
    try {
      const inv = await convertMut.mutateAsync({ id: quote.id, repairId: quote.repairId })
      toast.success(t('quotes:convertSuccess'))
      setConvertOpen(false)
      navigate(`/invoices/${String(inv.id ?? inv._id)}`)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error(t('quotes:convertAlreadyInvoiced'))
      } else {
        toast.error(t('quotes:convertError'))
      }
    }
  }

  const handlePrint = async () => {
    if (!quote) return
    try {
      const res = await api.get(`/quotes/${quote.id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch {
      toast.error(t('quotes:pdfPreviewError'))
    }
  }

  return (
    <div className="space-y-4">
      <Link to="/quotes" className="text-sm font-semibold text-clay-primary hover:underline">
        ← {t('quotes:backToList')}
      </Link>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        onRetry={() => void refetch()}
        isEmpty={!quote && !isLoading}
        empty={null}
        loading={<PageLoader />}
      >
        {quote ? (
          <>
            <ClayCard variant="elevated">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {t('quotes:quoteDetail')}
                  </p>
                  <CardTitle className="text-xl">{quote.number ?? quote.id.slice(-8)}</CardTitle>
                  <p className="mt-1 text-sm text-ink-secondary">
                    {refLabel(quote.clientId)}
                    {quote.vehicleId ? ` · ${refLabel(quote.vehicleId)}` : ''}
                  </p>
                  {quote.createdAt ? (
                    <p className="text-xs text-ink-muted">
                      {format(new Date(quote.createdAt), 'PP', { locale: localeDate })}
                    </p>
                  ) : null}
                </div>
                <QuoteStatusBadge status={status} />
              </CardHeader>
              <CardContent className="space-y-4">
                <QuoteWorkflowStepper status={status} />
                <QuoteRepairCard repairId={quote.repairId} />
                {quote.validUntil ? (
                  <p className="text-sm text-ink-secondary">
                    {t('quotes:validUntil')}:{' '}
                    {format(new Date(quote.validUntil), 'PP', { locale: localeDate })}
                  </p>
                ) : null}
                {displayNotes ? (
                  <p className="text-sm text-ink-secondary whitespace-pre-wrap">{displayNotes}</p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Button type="button" variant="secondary" onClick={() => setEditOpen(true)}>
                      {t('common:edit')}
                    </Button>
                  ) : null}
                  {status === 'draft' ? (
                    <>
                      <Button type="button" onClick={() => void handleSend()} disabled={sendEmail.isPending}>
                        {t('quotes:sendToClient')}
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={deleteMut.isPending}
                        onClick={async () => {
                          try {
                            await deleteMut.mutateAsync(quote.id)
                            toast.success(t('quotes:deleteSuccess'))
                            navigate('/quotes')
                          } catch {
                            toast.error(t('quotes:deleteError'))
                          }
                        }}
                      >
                        {t('common:delete')}
                      </Button>
                    </>
                  ) : null}
                  {status === 'sent' ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await patchStatus.mutateAsync({ id: quote.id, status: 'accepted' })
                            toast.success(t('quotes:statusUpdated'))
                          } catch {
                            toast.error(t('quotes:statusError'))
                          }
                        }}
                      >
                        {t('quotes:markAccepted')}
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={async () => {
                          try {
                            await patchStatus.mutateAsync({ id: quote.id, status: 'rejected' })
                            toast.success(t('quotes:statusUpdated'))
                          } catch {
                            toast.error(t('quotes:statusError'))
                          }
                        }}
                      >
                        {t('quotes:markRejected')}
                      </Button>
                    </>
                  ) : null}
                  {status === 'rejected' ? (
                    <Button type="button" variant="secondary" onClick={() => setEditOpen(true)}>
                      {t('quotes:editAndResend')}
                    </Button>
                  ) : null}
                  {canConvert ? (
                    <Button
                      type="button"
                      className="bg-clay-green text-white hover:opacity-90"
                      onClick={() => setConvertOpen(true)}
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                      {t('quotes:convert')}
                    </Button>
                  ) : null}
                  {status === 'invoiced' && linkedInvoice ? (
                    <Button asChild type="button" variant="secondary">
                      <Link to={`/invoices/${linkedInvoice.id}`}>{t('quotes:viewInvoice')}</Link>
                    </Button>
                  ) : null}
                  {status === 'expired' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await patchStatus.mutateAsync({ id: quote.id, status: 'draft' })
                          toast.success(t('quotes:renewSuccess'))
                        } catch {
                          toast.error(t('quotes:statusError'))
                        }
                      }}
                    >
                      {t('quotes:renewQuote')}
                    </Button>
                  ) : null}
                  <Button type="button" variant="secondary" onClick={() => void handlePrint()}>
                    <Printer className="h-4 w-4" />
                    {t('quotes:print')}
                  </Button>
                  {['accepted', 'rejected', 'invoiced', 'sent', 'expired', 'draft'].includes(status) ? (
                    <QuotePdfButtons entity="quotes" id={quote.id} fileName={pdfName} />
                  ) : null}
                </div>
              </CardContent>
            </ClayCard>

            <ClayCard variant="elevated">
              <CardHeader>
                <CardTitle className="text-base">{t('quotes:lines')}</CardTitle>
                <p className="text-lg font-bold text-clay-primary">
                  {formatTND(quote.totalTTC ?? 0)}
                </p>
              </CardHeader>
              <CardContent>
                <QuoteLinesTable
                  lines={quote.lines ?? []}
                  subtotalHT={quote.subtotalHT}
                  totalTVA={quote.totalTVA}
                  totalDiscount={quote.totalDiscount}
                  totalTTC={quote.totalTTC}
                />
              </CardContent>
            </ClayCard>

            <QuoteEditModal quote={quote} open={editOpen} onClose={() => setEditOpen(false)} />

            <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('quotes:convertConfirmTitle')}</DialogTitle>
                  <DialogDescription>{t('quotes:convertConfirmBody')}</DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" type="button" onClick={() => setConvertOpen(false)}>
                    {t('common:cancel')}
                  </Button>
                  <Button
                    type="button"
                    className="bg-clay-green text-white hover:opacity-90"
                    disabled={convertMut.isPending}
                    onClick={() => void handleConvert()}
                  >
                    {convertMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {t('common:confirm')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
      </QueryBoundary>
    </div>
  )
}
