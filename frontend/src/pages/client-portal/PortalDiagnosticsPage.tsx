import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DiagnosticReportView } from '@/components/repairs/DiagnosticReportView'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { getDiagnosticTypeFromNotes } from '@/components/planning/rdvPrestations'
import { useRepairsList, type ApiRepair } from '@/hooks/api/useRepairs'
import { hasDiagnosticReport, parseDiagnosticReport } from '@/lib/diagnosticReport'
import { useAuthStore } from '@/store/auth'

export function PortalDiagnosticsPage(): React.ReactElement {
  const { t } = useTranslation(['clientPortal', 'diagnostic'])
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, isError, error, refetch } = useRepairsList()
  const [selected, setSelected] = useState<ApiRepair | null>(null)

  const reports = useMemo(() => {
    const clientId = user?.clientId
    return (data?.items ?? []).filter((r) => {
      if (clientId) {
        const cid =
          r.clientId && typeof r.clientId === 'object'
            ? String((r.clientId as { id?: string; _id?: string }).id ?? (r.clientId as { _id?: string })._id ?? '')
            : String(r.clientId ?? '')
        if (cid !== clientId) return false
      }
      return hasDiagnosticReport(r.diagnosis)
    })
  }, [data?.items, user?.clientId])

  const selectedReport = selected ? parseDiagnosticReport(selected.diagnosis) : null
  const selectedType = selected ? getDiagnosticTypeFromNotes(selected.notes) : null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t('clientPortal:diagnosticsTitle')}</h1>
        <p className="text-sm text-ink-secondary">{t('clientPortal:diagnosticsSubtitle')}</p>
      </div>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        onRetry={() => void refetch()}
        isEmpty={!isLoading && reports.length === 0}
        loading={<TableSkeleton rows={4} />}
        empty={<p className="text-sm text-ink-muted">{t('clientPortal:diagnosticsEmpty')}</p>}
      >
        <div className="grid gap-3">
          {reports.map((r) => {
            const report = parseDiagnosticReport(r.diagnosis)
            if (!report) return null
            return (
              <ClayCard key={r.id} variant="elevated">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base">{report.mechanicName}</CardTitle>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setSelected(r)}>
                    {t('diagnostic:viewReport')}
                  </Button>
                </CardHeader>
                <CardContent className="text-sm text-ink-secondary line-clamp-2">
                  {report.observations}
                </CardContent>
              </ClayCard>
            )
          })}
        </div>
      </QueryBoundary>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('diagnostic:reportModalTitle')}</DialogTitle>
          </DialogHeader>
          {selectedReport ? (
            <DiagnosticReportView report={selectedReport} reportType={selectedType} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
