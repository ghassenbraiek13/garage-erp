import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ApiVehicle } from '@/hooks/api/useVehicles'
import { useUpdateVehicle } from '@/hooks/api/useVehicles'
import { cn } from '@/lib/utils'

const schema = z.object({
  plate: z.string().min(2).transform((v) => v.toUpperCase()),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(2030).optional(),
  vin: z.string().max(17).optional(),
  engine: z.string().optional(),
  fuelType: z.enum(['essence', 'diesel', 'hybride', 'electrique', 'autre']).optional(),
  color: z.string().optional(),
  mileage: z.coerce.number().int().min(0).optional(),
  transmission: z.string().optional(),
  bodyType: z.string().optional(),
  doors: z.coerce.number().int().min(0).optional(),
  power: z.coerce.number().min(0).optional(),
  displacement: z.coerce.number().min(0).optional(),
  co2: z.coerce.number().min(0).optional(),
})

type FormValues = z.infer<typeof schema>

const selectClass = cn(
  'flex h-11 w-full rounded-[var(--radius-input)] border border-[var(--border-strong)]',
  'bg-[var(--bg-input)] px-3 text-sm text-ink-primary',
)

type VehicleEditModalProps = {
  vehicle: ApiVehicle | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function VehicleEditModal({ vehicle, open, onOpenChange, onSaved }: VehicleEditModalProps) {
  const { t } = useTranslation(['vehicles', 'clientPortal', 'common'])
  const updateMut = useUpdateVehicle()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      plate: '',
      make: '',
      model: '',
      fuelType: 'essence',
    },
  })

  useEffect(() => {
    if (!vehicle || !open) return
    form.reset({
      plate: vehicle.plate ?? '',
      make: vehicle.make ?? '',
      model: vehicle.model ?? '',
      year: vehicle.year,
      vin: vehicle.vin ?? '',
      engine: vehicle.engine ?? '',
      fuelType: (vehicle.fuelType as FormValues['fuelType']) ?? 'essence',
      color: vehicle.color ?? '',
      mileage: vehicle.mileage,
      transmission: vehicle.transmission ?? '',
      bodyType: vehicle.bodyType ?? '',
      doors: vehicle.doors,
      power: vehicle.power,
      displacement: vehicle.displacement,
      co2: vehicle.co2,
    })
  }, [vehicle, open, form])

  const onSubmit = form.handleSubmit(async (values) => {
    if (!vehicle) return
    try {
      await updateMut.mutateAsync({
        id: vehicle.id,
        body: {
          plate: values.plate,
          make: values.make,
          model: values.model,
          year: values.year,
          vin: values.vin || undefined,
          engine: values.engine || undefined,
          fuelType: values.fuelType,
          color: values.color || undefined,
          mileage: values.mileage,
          transmission: values.transmission || undefined,
          bodyType: values.bodyType || undefined,
          doors: values.doors ?? undefined,
          power: values.power ?? undefined,
          displacement: values.displacement ?? undefined,
          co2: values.co2 ?? undefined,
        },
      })
      toast.success(t('vehicles:editSuccess', { defaultValue: 'Véhicule modifié avec succès' }))
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error(t('vehicles:editError', { defaultValue: 'Impossible de modifier le véhicule' }))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('vehicles:editTitle', { defaultValue: 'Modifier le véhicule' })}</DialogTitle>
        </DialogHeader>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-plate">{t('vehicles:plate')}</Label>
              <Input id="edit-plate" className="uppercase" {...form.register('plate')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-vin">{t('vehicles:vin')}</Label>
              <Input id="edit-vin" className="font-mono uppercase" {...form.register('vin')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-make">{t('clientPortal:vehicleMake')}</Label>
              <Input id="edit-make" {...form.register('make')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-model">{t('clientPortal:vehicleModel')}</Label>
              <Input id="edit-model" {...form.register('model')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-year">{t('clientPortal:vehicleYear')}</Label>
              <Input id="edit-year" type="number" {...form.register('year')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-mileage">{t('vehicles:mileage')}</Label>
              <Input id="edit-mileage" type="number" min={0} {...form.register('mileage')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-engine">{t('vehicles:engine')}</Label>
              <Input id="edit-engine" {...form.register('engine')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-fuelType">{t('clientPortal:vehicleFuel')}</Label>
              <select id="edit-fuelType" className={selectClass} {...form.register('fuelType')}>
                <option value="essence">{t('clientPortal:fuelEssence')}</option>
                <option value="diesel">{t('clientPortal:fuelDiesel')}</option>
                <option value="hybride">{t('clientPortal:fuelHybrid')}</option>
                <option value="electrique">{t('clientPortal:fuelElectric')}</option>
                <option value="autre">{t('vehicles:fuelOther')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-color">{t('clientPortal:vehicleColor')}</Label>
              <Input id="edit-color" {...form.register('color')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-transmission">{t('vehicles:transmission')}</Label>
              <Input id="edit-transmission" {...form.register('transmission')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-bodyType">{t('vehicles:bodyType')}</Label>
              <Input id="edit-bodyType" {...form.register('bodyType')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-doors">{t('vehicles:doors')}</Label>
              <Input id="edit-doors" type="number" min={0} {...form.register('doors')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-power">{t('vehicles:power')}</Label>
              <Input id="edit-power" type="number" min={0} step="0.1" {...form.register('power')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-displacement">{t('vehicles:displacement')}</Label>
              <Input
                id="edit-displacement"
                type="number"
                min={0}
                step="0.1"
                {...form.register('displacement')}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-co2">{t('vehicles:co2')}</Label>
            <Input id="edit-co2" type="number" min={0} step="0.1" {...form.register('co2')} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common:cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={updateMut.isPending}>
              {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('common:save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
