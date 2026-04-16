import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { useVehiclesList } from '@/hooks/api/useVehicles'

export function PortalVehiclesPage(): React.ReactElement {
  const { data, isLoading, isError, error, refetch } = useVehiclesList()
  const vehicles = data?.items ?? []

  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={isError}
      error={error as Error}
      onRetry={() => void refetch()}
      isEmpty={!isLoading && vehicles.length === 0}
      loading={<TableSkeleton rows={4} />}
      empty={<p className="text-sm text-ink-muted">Aucun véhicule</p>}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {vehicles.map((v) => (
          <ClayCard key={v.id} variant="elevated">
            <CardHeader>
              <CardTitle className="text-base">
                {v.make} {v.model}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-ink-secondary">
              {v.plate} · {(v.mileage ?? 0).toLocaleString('fr-FR')} km
            </CardContent>
          </ClayCard>
        ))}
      </div>
    </QueryBoundary>
  )
}
