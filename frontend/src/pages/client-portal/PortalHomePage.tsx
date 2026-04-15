import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockAppointments } from '@/mocks/mockAppointments'
import { mockVehicles } from '@/mocks/mockVehicles'

export function PortalHomePage() {
  const { t } = useTranslation('clientPortal')
  const vehicles = mockVehicles.slice(0, 3)
  const next = mockAppointments[0]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t('myVehicles')}</h1>
        <p className="text-sm text-ink-secondary">Vue simplifiée — données fictives</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {vehicles.map((v) => (
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
      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Prochain RDV</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {next ? (
            <p>
              {new Date(next.start).toLocaleString('fr-FR')} — {next.notes}
            </p>
          ) : (
            <p>Aucun rendez-vous</p>
          )}
          <Link className="mt-3 inline-flex font-semibold text-clay-primary" to="/portal/book">
            {t('book')}
          </Link>
        </CardContent>
      </ClayCard>
    </div>
  )
}
