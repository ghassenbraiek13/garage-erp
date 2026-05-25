import { format } from 'date-fns'
import { arSA, fr } from 'date-fns/locale'
import { Download, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AddVehicleModal } from '@/components/portal/AddVehicleModal'
import { PortalVehicleCard } from '@/components/portal/PortalVehicleCard'
import { RdvWizardModal } from '@/components/portal/RdvWizardModal'
import { DiagnosticReportView } from '@/components/repairs/DiagnosticReportView'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { getDiagnosticTypeFromNotes } from '@/components/planning/rdvPrestations'
import { useRepairsList, type ApiRepair } from '@/hooks/api/useRepairs'
import { useVehicle } from '@/hooks/api/useVehicles'
import { hasDiagnosticReport, parseDiagnosticReport } from '@/lib/diagnosticReport'
import { useExportCarnetPdf } from '@/hooks/api/useClients'
import { usePortalClientId, usePortalVehicles } from '@/hooks/usePortalClient'
import { useLocaleStore } from '@/store/locale'
import { toast } from 'sonner'

function popName(x: unknown): string {
  if (x && typeof x === 'object' && 'name' in x) return String((x as { name: unknown }).name)
  return '—'
}

export function PortalBookletPage(): React.ReactElement {
  const { t } = useTranslation(['clientPortal', 'diagnostic'])
  const [params] = useSearchParams()
  const vehicleId = params.get('vehicleId')
  const navigate = useNavigate()
  const locale = useLocaleStore((s) => s.locale)
  const dateLocale = locale === 'ar' ? arSA : fr

  const clientId = usePortalClientId()
  const exportPdfMut = useExportCarnetPdf()
  const { data: vehicles = [], isLoading: vLoading, refetch } = usePortalVehicles()
  const { data: repairsData, isLoading: rLoading } = useRepairsList(
    vehicleId ? { vehicleId } : undefined,
  )
  const { data: vehicle } = useVehicle(vehicleId ?? undefined)

  const [addOpen, setAddOpen] = useState(false)
  const [rdvVehicleId, setRdvVehicleId] = useState<string | null>(null)
  const [reportRepair, setReportRepair] = useState<ApiRepair | null>(null)

  const lastByVehicle = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of repairsData?.items ?? []) {
      const vid =
        r.vehicleId && typeof r.vehicleId === 'object'
          ? String((r.vehicleId as { _id?: string })._id ?? '')
          : String(r.vehicleId ?? '')
      const d = r.endDate ?? r.startDate
      if (vid && d) {
        const existing = map.get(vid)
        if (!existing || d > existing) map.set(vid, String(d).slice(0, 10))
      }
    }
    return map
  }, [repairsData?.items])

  const repairs = useMemo(() => {
    const items = repairsData?.items ?? []
    return [...items].sort((a, b) => {
      const da = a.startDate ?? ''
      const db = b.startDate ?? ''
      return db.localeCompare(da)
    })
  }, [repairsData?.items])

  const handleExportPDF = async () => {
    if (!clientId || !vehicleId || !vehicle) {
      toast.error(t('clientPortal:exportPdfError'))
      return
    }
    try {
      const blob = await exportPdfMut.mutateAsync({ clientId, vehicleId })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `carnet-${vehicle.plate}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t('clientPortal:exportPdfError'))
    }
  }

  if (!vehicleId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{t('clientPortal:bookletSelectTitle')}</h1>
        <QueryBoundary
          isLoading={vLoading}
          isError={false}
          onRetry={() => void refetch()}
          isEmpty={!vLoading && vehicles.length === 0}
          loading={<TableSkeleton rows={4} />}
          empty={<p className="text-sm text-ink-muted">{t('clientPortal:vehiclesEmpty')}</p>}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {vehicles.map((v) => (
              <button
                key={v.id}
                type="button"
                className="text-start"
                onClick={() => navigate(`/portal/booklet?vehicleId=${v.id}`)}
              >
                <PortalVehicleCard
                  vehicle={v}
                  variant="bookletSelect"
                  lastMaintenance={lastByVehicle.get(v.id)}
                />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-sidebar)] p-4 font-semibold text-clay-primary"
            >
              <Plus className="h-8 w-8" />
              {t('clientPortal:addVehicleCard')}
            </button>
          </div>
        </QueryBoundary>
        <AddVehicleModal
          open={addOpen}
          onOpenChange={setAddOpen}
          onCreated={(id) => navigate(`/portal/booklet?vehicleId=${id}`)}
        />
      </div>
    )
  }

  const selectedReport = reportRepair ? parseDiagnosticReport(reportRepair.diagnosis) : null
  const selectedType = reportRepair ? getDiagnosticTypeFromNotes(reportRepair.notes) : null

  return (
    <div className="space-y-4 portal-carnet-printable">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <Button type="button" variant="ghost" onClick={() => navigate('/portal/booklet')}>
          ← {t('clientPortal:bookletBack')}
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={exportPdfMut.isPending}
            onClick={() => void handleExportPDF()}
          >
            <Download className="h-4 w-4" />
            {t('clientPortal:exportPdf')}
          </Button>
        </div>
      </div>

      {vehicle ? (
        <ClayCard variant="elevated">
          <CardHeader>
            <CardTitle className="text-lg">
              {vehicle.make} {vehicle.model} {vehicle.year ?? ''} — {vehicle.plate}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-ink-secondary">
            {t('clientPortal:currentMileage')}: {(vehicle.mileage ?? 0).toLocaleString('fr-FR')} km
          </CardContent>
        </ClayCard>
      ) : null}

      <QueryBoundary
        isLoading={rLoading}
        isError={false}
        onRetry={() => {}}
        isEmpty={!rLoading && repairs.length === 0}
        loading={<TableSkeleton rows={4} />}
        empty={
          <div className="space-y-3 text-center">
            <p className="text-sm text-ink-muted">{t('clientPortal:bookletEmpty')}</p>
            <Button type="button" onClick={() => setRdvVehicleId(vehicleId)}>
              {t('clientPortal:bookletEmptyCta')}
            </Button>
          </div>
        }
      >
        <ol className="relative space-y-4 border-s-2 border-[var(--border)] ps-6">
          {repairs.map((r) => {
            const dateStr = r.startDate
              ? format(new Date(r.startDate), 'd MMMM yyyy', { locale: dateLocale })
              : '—'
            return (
              <li key={r.id} className="relative">
                <span className="absolute -start-[31px] top-1 h-3 w-3 rounded-full bg-clay-primary" />
                <ClayCard variant="elevated">
                  <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">{dateStr}</CardTitle>
                    <StatusBadge status={r.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'} />
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-ink-secondary">
                    <p>
                      <span className="font-medium text-ink-primary">{t('clientPortal:bookletMechanic')}:</span>{' '}
                      {popName(r.mechanicId)}
                    </p>
                    {r.notes ? (
                      <p>
                        <span className="font-medium text-ink-primary">{t('clientPortal:bookletNotes')}:</span>{' '}
                        {r.notes}
                      </p>
                    ) : null}
                    {hasDiagnosticReport(r.diagnosis) ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => setReportRepair(r)}>
                        {t('clientPortal:viewDiagnosticReport')}
                      </Button>
                    ) : null}
                  </CardContent>
                </ClayCard>
              </li>
            )
          })}
        </ol>
      </QueryBoundary>

      <RdvWizardModal
        open={Boolean(rdvVehicleId)}
        onOpenChange={(o) => !o && setRdvVehicleId(null)}
        vehicleId={rdvVehicleId ?? undefined}
      />

      <Dialog open={Boolean(reportRepair)} onOpenChange={(o) => !o && setReportRepair(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('diagnostic:reportModalTitle')}</DialogTitle>
          </DialogHeader>
          {selectedReport ? (
            <DiagnosticReportView report={selectedReport} reportType={selectedType} />
          ) : null}
        </DialogContent>
      </Dialog>

      <AddVehicleModal open={addOpen} onOpenChange={setAddOpen} onCreated={() => void refetch()} />
    </div>
  )
}
