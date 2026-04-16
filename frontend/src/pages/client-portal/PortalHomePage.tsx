import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { useAppointmentsUpcoming } from '@/hooks/api/useAppointments'
import { useVehiclesList } from '@/hooks/api/useVehicles'

export function PortalHomePage(): React.ReactElement {
  const { t } = useTranslation('clientPortal')
  const { data: vehData, isLoading: vLoad, isError: vErr, error: vError, refetch: vRefetch } = useVehiclesList()
  const { data: upcoming, isLoading: uLoad, isError: uErr, error: uError, refetch: uRefetch } = useAppointmentsUpcoming()

  const vehicles = vehData?.items ?? []
  const next = upcoming?.[0]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t('myVehicles')}</h1>
        <p className="text-sm text-ink-secondary">Données de votre compte</p>
      </div>
      <QueryBoundary
        isLoading={vLoad}
        isError={vErr}
        error={vError as Error}
        onRetry={() => void vRefetch()}
        isEmpty={!vLoad && vehicles.length === 0}
        loading={<TableSkeleton rows={3} />}
        empty={<p className="text-sm text-ink-muted">Aucun véhicule</p>}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {vehicles.slice(0, 6).map((v) => (
            <ClayCard key={v.id} variant="elevated">
              <CardHeader>
                <CardTitle className="text-base">
                  {v.make} {v.model}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-ink-secondary">{v.plate}</CardContent>
            </ClayCard>
          ))}
        </div>
      </QueryBoundary>

      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Prochain RDV</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <QueryBoundary
            isLoading={uLoad}
            isError={uErr}
            error={uError as Error}
            onRetry={() => void uRefetch()}
            isEmpty={!uLoad && !next}
            loading={<p className="text-ink-muted">Chargement…</p>}
            empty={<p>Aucun rendez-vous</p>}
          >
            {next ? (
              <p>
                {new Date(next.start).toLocaleString('fr-FR')} — {next.notes ?? '—'}
              </p>
            ) : null}
          </QueryBoundary>
        </CardContent>
      </ClayCard>

      <Link className="text-sm font-semibold text-clay-primary" to="/portal/vehicles">
        Voir tous les véhicules
      </Link>
    </div>
  )
}
