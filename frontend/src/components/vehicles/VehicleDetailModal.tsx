import { format } from 'date-fns'
import { arSA, fr } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { ApiVehicle } from '@/hooks/api/useVehicles'
import { cn } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'

type VehicleDetailModalProps = {
  vehicle: ApiVehicle | null
  clientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border border-[var(--border)]',
        'bg-[var(--bg-sidebar)] px-3 py-2',
      )}
    >
      <Label className="text-xs text-ink-muted">{label}</Label>
      <p className="mt-0.5 text-sm font-medium text-ink-primary">{value}</p>
    </div>
  )
}

function displayValue(v: string | number | undefined | null): string {
  if (v === undefined || v === null || v === '') return '—'
  return String(v)
}

function fuelLabel(
  fuel: string | undefined,
  t: (key: string) => string,
): string {
  if (!fuel) return '—'
  const map: Record<string, string> = {
    essence: t('clientPortal:fuelEssence'),
    diesel: t('clientPortal:fuelDiesel'),
    hybride: t('clientPortal:fuelHybrid'),
    electrique: t('clientPortal:fuelElectric'),
    autre: t('vehicles:fuelOther'),
  }
  return map[fuel] ?? fuel
}

export function VehicleDetailModal({
  vehicle,
  clientName,
  open,
  onOpenChange,
  onEdit,
}: VehicleDetailModalProps) {
  const { t } = useTranslation(['vehicles', 'clientPortal', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const dateLocale = locale === 'ar' ? arSA : fr

  if (!vehicle) return null

  const lastService = vehicle.lastServiceDate
    ? format(new Date(vehicle.lastServiceDate), 'PP', { locale: dateLocale })
    : '—'

  const mileage =
    vehicle.mileage != null
      ? `${vehicle.mileage.toLocaleString(locale === 'ar' ? 'ar-TN' : 'fr-FR')} km`
      : '—'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {vehicle.make} {vehicle.model}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">{vehicle.plate}</Badge>
            {vehicle.year ? (
              <span className="text-sm text-ink-secondary">{vehicle.year}</span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <DetailRow label={t('vehicles:vin')} value={displayValue(vehicle.vin)} />
          <DetailRow label={t('vehicles:associatedClient')} value={clientName || '—'} />
          <DetailRow label={t('vehicles:mileage')} value={mileage} />
          <DetailRow
            label={t('clientPortal:vehicleFuel')}
            value={fuelLabel(vehicle.fuelType, t)}
          />
          <DetailRow label={t('clientPortal:vehicleColor')} value={displayValue(vehicle.color)} />
          <DetailRow label={t('vehicles:engine')} value={displayValue(vehicle.engine)} />
          <DetailRow label={t('vehicles:transmission')} value={displayValue(vehicle.transmission)} />
          <DetailRow label={t('vehicles:bodyType')} value={displayValue(vehicle.bodyType)} />
          <DetailRow label={t('vehicles:doors')} value={displayValue(vehicle.doors)} />
          <DetailRow
            label={t('vehicles:power')}
            value={vehicle.power != null ? `${vehicle.power} kW` : '—'}
          />
          <DetailRow
            label={t('vehicles:displacement')}
            value={vehicle.displacement != null ? `${vehicle.displacement} cm³` : '—'}
          />
          <DetailRow
            label={t('vehicles:co2')}
            value={vehicle.co2 != null ? `${vehicle.co2} g/km` : '—'}
          />
          <DetailRow label={t('vehicles:lastService')} value={lastService} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common:close')}
          </Button>
          <Button type="button" variant="primary" onClick={onEdit}>
            {t('common:edit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
