import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isDiagnosticRepairNotes } from '@/components/planning/rdvPrestations'
import { DiagnosticReportForm } from '@/components/repairs/DiagnosticReportForm'
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PageLoader } from '@/components/shared/PageLoader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useQuotesList } from '@/hooks/api/useQuotes'
import { useRepair } from '@/hooks/api/useRepairs'
import { refIdStr } from '@/lib/quoteUtils'
import { cn } from '@/lib/utils'
import { formatTND } from '@/utils/currency'
import { useAuthStore } from '@/store/auth'
import { useLocaleStore } from '@/store/locale'
import api from '@/utils/api'

function refLabel(x: unknown, fallback = '—'): string {
  if (!x) return fallback
  if (typeof x === 'object') {
    const o = x as Record<string, unknown>
    if (typeof o.name === 'string') return o.name
    if (typeof o.plate === 'string') {
      const make = typeof o.make === 'string' ? o.make : ''
      const model = typeof o.model === 'string' ? o.model : ''
      return `${o.plate} — ${make} ${model}`.trim()
    }
  }
  return fallback
}

function mapStatus(s: string): 'in_progress' | 'completed' | 'pending' | 'cancelled' {
  if (s === 'in_progress' || s === 'waiting_parts') return 'in_progress'
  if (s === 'completed') return 'completed'
  if (s === 'pending') return 'pending'
  return 'cancelled'
}

export function RepairDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation(['repairs', 'common'])
  const user = useAuthStore((s) => s.user)
  const locale = useLocaleStore((s) => s.locale)
  const qc = useQueryClient()
  const { data: repair, isLoading, isError, error, refetch } = useRepair(id)
  const { data: quotesData } = useQuotesList()

  const handleStatusChange = async (newStatus: string) => {
    if (!repair) return
    try {
      await api.patch(`/repairs/${repair.id}/status`, { status: newStatus })
      await qc.invalidateQueries({ queryKey: ['repairs'] })
      await qc.invalidateQueries({ queryKey: ['repairs', 'detail', repair.id] })
      toast.success(t('repairs:statusUpdated'))
      void refetch()
    } catch {
      toast.error(t('repairs:statusError'))
    }
  }

  const linkedQuote = useMemo(
    () => (quotesData?.items ?? []).find((q) => q.repairId === id),
    [quotesData, id],
  )
  const linkedInvoiceId = repair ? refIdStr(repair.invoiceId) : ''

  const isDiagnostic = repair ? isDiagnosticRepairNotes(repair.notes) : false
  const showReportForm =
    isDiagnostic && repair && (user?.role === 'mechanic' || user?.role === 'manager')

  return (
    <div className="space-y-4">
        <Link to="/repairs" className="text-sm font-semibold text-clay-primary hover:underline">
          ← {t('repairs:backToList')}
        </Link>

        <QueryBoundary
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          onRetry={() => void refetch()}
          isEmpty={!repair && !isLoading}
          empty={null}
          loading={<PageLoader />}
        >
          {repair ? (
            <>
              <ClayCard variant="elevated">
                <CardHeader>
                  <CardTitle className="text-base">{t('repairs:detailTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="font-semibold">{t('repairs:colClient')}:</span> {refLabel(repair.clientId)}
                  </p>
                  <p>
                    <span className="font-semibold">{t('repairs:colVehicle')}:</span> {refLabel(repair.vehicleId)}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={mapStatus(repair.status)} />
                    {user?.role === 'manager' || user?.role === 'mechanic' ? (
                      <select
                        value={repair.status}
                        onChange={(e) => void handleStatusChange(e.target.value)}
                        className={cn(
                          'rounded-xl border border-[var(--border)] bg-[var(--bg-input)]',
                          'px-3 py-1.5 text-sm text-ink-primary',
                        )}
                        aria-label={t('common:status')}
                      >
                        <option value="pending">{t('repairs:statusPending')}</option>
                        <option value="in_progress">{t('repairs:statusInProgress')}</option>
                        <option value="waiting_parts">{t('repairs:statusWaitingParts')}</option>
                        <option value="completed">{t('repairs:statusCompleted')}</option>
                        <option value="cancelled">{t('repairs:statusCancelled')}</option>
                      </select>
                    ) : null}
                  </div>
                  {repair.notes ? (
                    <p className="sm:col-span-2 whitespace-pre-wrap text-ink-secondary">{repair.notes}</p>
                  ) : null}
                </CardContent>
              </ClayCard>

              <ClayCard variant="elevated">
                <CardHeader>
                  <CardTitle className="text-base">{t('repairs:quotesInvoicesSection')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {linkedQuote ? (
                    <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-ink-primary">
                          {linkedQuote.number ?? linkedQuote.id.slice(-8)}
                        </p>
                        <p className="text-sm text-ink-secondary">
                          {formatTND(linkedQuote.totalTTC ?? 0)}
                        </p>
                        <QuoteStatusBadge status={linkedQuote.status} />
                      </div>
                      <Button asChild variant="secondary" size="sm">
                        <Link to={`/quotes/${linkedQuote.id}`}>{t('repairs:viewQuote')}</Link>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-ink-muted">{t('repairs:noLinkedQuote')}</p>
                  )}
                  {linkedInvoiceId ? (
                    <Button asChild variant="secondary" size="sm">
                      <Link to={`/invoices/${linkedInvoiceId}`}>{t('repairs:viewInvoice')}</Link>
                    </Button>
                  ) : null}
                </CardContent>
              </ClayCard>

              {showReportForm ? (
                <ClayCard variant="elevated">
                  <CardHeader>
                    <CardTitle className="text-base">{t('repairs:reportSectionTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DiagnosticReportForm
                      repairId={repair.id}
                      notes={repair.notes}
                      diagnosis={repair.diagnosis}
                      vehicleLabel={refLabel(repair.vehicleId)}
                      clientLabel={refLabel(repair.clientId)}
                    />
                  </CardContent>
                </ClayCard>
              ) : null}
            </>
          ) : null}
        </QueryBoundary>
    </div>
  )
}
