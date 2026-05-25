import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { useVehicle } from '@/hooks/api/useVehicles'

export function PortalVehicleDetailPage(): React.ReactElement {
  const { t } = useTranslation('clientPortal')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: vehicle, isLoading, isError, error, refetch } = useVehicle(id)

  return (
    <div className="space-y-4">
      <Button type="button" variant="ghost" onClick={() => navigate('/portal/vehicles')}>
        ← {t('backToVehicles')}
      </Button>
      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        onRetry={() => void refetch()}
        isEmpty={!vehicle}
        loading={<TableSkeleton rows={3} />}
        empty={<p className="text-sm text-ink-muted">{t('vehicleNotFound')}</p>}
      >
        {vehicle ? (
          <ClayCard variant="elevated">
            <CardHeader>
              <CardTitle className="text-xl">
                {vehicle.make} {vehicle.model} {vehicle.year ?? ''}
              </CardTitle>
              <Badge variant="default">{vehicle.plate}</Badge>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-ink-secondary sm:grid-cols-2">
              {vehicle.vin ? (
                <p>
                  <span className="font-medium text-ink-primary">{t('vehicleVin')}:</span> {vehicle.vin}
                </p>
              ) : null}
              {vehicle.fuelType ? (
                <p>
                  <span className="font-medium text-ink-primary">{t('vehicleFuel')}:</span> {vehicle.fuelType}
                </p>
              ) : null}
              <p>
                <span className="font-medium text-ink-primary">{t('vehicleMileage')}:</span>{' '}
                {(vehicle.mileage ?? 0).toLocaleString('fr-FR')} km
              </p>
            </CardContent>
          </ClayCard>
        ) : null}
      </QueryBoundary>
    </div>
  )
}
