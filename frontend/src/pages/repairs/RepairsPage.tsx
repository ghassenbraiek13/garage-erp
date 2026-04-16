import { useTranslation } from 'react-i18next'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataColumn } from '@/components/ui/DataTable'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useRepairsList, type ApiRepair } from '@/hooks/api/useRepairs'

function refId(x: unknown): string {
  if (x && typeof x === 'object' && '_id' in x) return String((x as { _id: unknown })._id)
  return String(x ?? '')
}

function mapStatus(s: string): 'in_progress' | 'completed' | 'pending' | 'cancelled' {
  if (s === 'in_progress' || s === 'waiting_parts') return 'in_progress'
  if (s === 'completed') return 'completed'
  if (s === 'pending') return 'pending'
  return 'cancelled'
}

export function RepairsPage(): React.ReactElement {
  const { t } = useTranslation(['repairs', 'common'])
  const { data, isLoading, isError, error, refetch } = useRepairsList()
  const rows = data?.items ?? []

  const columns: DataColumn<ApiRepair>[] = [
    { id: 'client', header: 'Client', cell: (r) => <span className="font-mono text-xs">{refId(r.clientId).slice(-6)}</span> },
    { id: 'vehicle', header: 'Véhicule', cell: (r) => <span className="font-mono text-xs">{refId(r.vehicleId).slice(-6)}</span> },
    { id: 'mech', header: 'Mécano', cell: (r) => <span className="text-xs">{refId(r.mechanicId)}</span> },
    { id: 'notes', header: 'Notes', cell: (r) => r.notes ?? r.diagnosis ?? '—' },
    { id: 'status', header: t('common:status'), cell: (r) => <StatusBadge status={mapStatus(r.status)} /> },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-fluid-h1 font-semibold">{t('title', { ns: 'repairs' })}</h1>
        <p className="text-sm text-ink-secondary">Interventions — API</p>
      </div>
      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Liste</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryBoundary
            isLoading={isLoading}
            isError={isError}
            error={error as Error}
            onRetry={() => void refetch()}
            isEmpty={!isLoading && rows.length === 0}
            loading={<TableSkeleton rows={6} />}
            empty={<p className="text-sm text-ink-muted">Aucune réparation</p>}
          >
            <DataTable columns={columns} data={rows} getRowKey={(r) => r.id} />
          </QueryBoundary>
        </CardContent>
      </ClayCard>
    </div>
  )
}
