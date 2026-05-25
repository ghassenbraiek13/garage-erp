import { BookOpen, CalendarPlus, Eye, Fuel } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ApiVehicle } from '@/hooks/api/useVehicles'
import { cn } from '@/lib/utils'

type PortalVehicleCardProps = {
  vehicle: ApiVehicle
  lastMaintenance?: string
  onBookRdv?: (vehicleId: string) => void
  /** Sélection carnet : carte informative seule, sans boutons d'action */
  variant?: 'default' | 'bookletSelect'
  className?: string
}

export function PortalVehicleCard({
  vehicle,
  lastMaintenance,
  onBookRdv,
  variant = 'default',
  className,
}: PortalVehicleCardProps) {
  const { t } = useTranslation('clientPortal')
  const navigate = useNavigate()
  const showActions = variant === 'default'

  return (
    <ClayCard variant="elevated" className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle className="text-base">
          {vehicle.make} {vehicle.model}
          {vehicle.year ? ` ${vehicle.year}` : ''}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="default">{vehicle.plate}</Badge>
          {vehicle.fuelType ? (
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <Fuel className="h-3.5 w-3.5" aria-hidden />
              {vehicle.fuelType}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn('flex flex-1 flex-col gap-3', !showActions && 'pb-4')}>
        <p className="text-sm text-ink-secondary">
          {(vehicle.mileage ?? 0).toLocaleString('fr-FR')} km
          {lastMaintenance ? ` · ${t('lastMaintenance', { date: lastMaintenance })}` : ''}
        </p>
        {showActions ? (
          <div className="mt-auto flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/portal/booklet?vehicleId=${vehicle.id}`)
              }}
            >
              <BookOpen className="h-4 w-4" />
              {t('bookletAction')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                onBookRdv?.(vehicle.id)
              }}
            >
              <CalendarPlus className="h-4 w-4" />
              {t('bookRdvAction')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/portal/vehicles/${vehicle.id}`)
              }}
            >
              <Eye className="h-4 w-4" />
              {t('viewDetails')}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </ClayCard>
  )
}
