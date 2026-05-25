import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AddVehicleModal } from '@/components/portal/AddVehicleModal'
import { PortalVehicleCard } from '@/components/portal/PortalVehicleCard'
import { RdvWizardModal } from '@/components/portal/RdvWizardModal'
import { Button } from '@/components/ui/button'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { useRepairsList } from '@/hooks/api/useRepairs'
import { usePortalVehicles } from '@/hooks/usePortalClient'

export function PortalVehiclesPage(): React.ReactElement {
  const { t } = useTranslation('clientPortal')
  const { data: vehicles = [], isLoading, isError, error, refetch } = usePortalVehicles()
  const { data: repairsData } = useRepairsList()
  const [addOpen, setAddOpen] = useState(false)
  const [rdvVehicleId, setRdvVehicleId] = useState<string | null>(null)

  const lastByVehicle = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of repairsData?.items ?? []) {
      const vid =
        r.vehicleId && typeof r.vehicleId === 'object'
          ? String((r.vehicleId as { _id?: string })._id ?? '')
          : String(r.vehicleId ?? '')
      const d = r.endDate ?? r.startDate
      if (vid && d) map.set(vid, String(d).slice(0, 10))
    }
    return map
  }, [repairsData?.items])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink-primary">{t('myVehicles')}</h1>
        <Button type="button" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('addVehicleButton')}
        </Button>
      </div>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        onRetry={() => void refetch()}
        isEmpty={!isLoading && vehicles.length === 0}
        loading={<TableSkeleton rows={4} />}
        empty={
          <div className="space-y-3 text-center">
            <p className="text-sm text-ink-muted">{t('vehiclesEmpty')}</p>
            <Button type="button" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('addVehicleButton')}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {vehicles.map((v) => (
            <PortalVehicleCard
              key={v.id}
              vehicle={v}
              lastMaintenance={lastByVehicle.get(v.id)}
              onBookRdv={(id) => setRdvVehicleId(id)}
            />
          ))}
        </div>
      </QueryBoundary>

      <AddVehicleModal open={addOpen} onOpenChange={setAddOpen} />
      <RdvWizardModal
        open={Boolean(rdvVehicleId)}
        onOpenChange={(o) => !o && setRdvVehicleId(null)}
        vehicleId={rdvVehicleId ?? undefined}
      />
    </div>
  )
}
