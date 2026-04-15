import { mockVehicles } from '@/mocks/mockVehicles'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PortalVehiclesPage() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {mockVehicles.slice(0, 6).map((v) => (
        <ClayCard key={v.id} variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">
              {v.make} {v.model}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-ink-secondary">
            {v.plate} · {v.mileage.toLocaleString('fr-FR')} km
          </CardContent>
        </ClayCard>
      ))}
    </div>
  )
}
