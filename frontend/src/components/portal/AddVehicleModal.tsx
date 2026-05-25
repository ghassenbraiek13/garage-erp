import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Loader2, UserPlus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreateClientDialog } from '@/components/clients/CreateClientDialog'
import { VehicleVinField, mapFuelToEnum, vinAutofillFieldClass } from '@/components/vehicles/VehicleVinField'
import { useClientsList } from '@/hooks/api/useClients'
import { useCreateVehicle, type VinDecodeResult } from '@/hooks/api/useVehicles'
import { usePortalClientId } from '@/hooks/usePortalClient'
import { cn } from '@/lib/utils'

const currentYear = new Date().getFullYear()

const schema = z.object({
  clientId: z.string().optional(),
  plate: z.string().min(2).transform((v) => v.toUpperCase()),
  vin: z.string().max(17).optional(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1990).max(currentYear),
  engine: z.string().optional(),
  fuelType: z.enum(['essence', 'diesel', 'hybride', 'electrique', 'autre']),
  transmission: z.string().optional(),
  bodyType: z.string().optional(),
  color: z.string().optional(),
  doors: z.coerce.number().int().min(0).optional(),
  power: z.coerce.number().min(0).optional(),
  mileage: z.coerce.number().int().min(0),
})

type FormValues = z.infer<typeof schema>

const selectClass = cn(
  'flex h-11 w-full rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 text-sm text-ink-primary',
)

export type AddVehicleModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (vehicleId: string) => void
  clientId?: string
  showClientSelect?: boolean
}

function applyVinDecode(form: ReturnType<typeof useForm<FormValues>>, data: VinDecodeResult) {
  if (data.make) form.setValue('make', data.make)
  if (data.model) form.setValue('model', data.model)
  if (data.year) form.setValue('year', Number(data.year))
  const fuel = mapFuelToEnum(data.fuelType)
  if (fuel) form.setValue('fuelType', fuel)
  if (data.engine) form.setValue('engine', data.engine)
  if (data.transmission) form.setValue('transmission', data.transmission)
  if (data.bodyType) form.setValue('bodyType', data.bodyType)
  if (data.color) form.setValue('color', data.color)
  if (data.doors) form.setValue('doors', Number(data.doors))
  if (data.power) form.setValue('power', Number(data.power))
}

export function AddVehicleModal({
  open,
  onOpenChange,
  onCreated,
  clientId: clientIdProp,
  showClientSelect = false,
}: AddVehicleModalProps) {
  const { t } = useTranslation(['clientPortal', 'vehicles', 'common'])
  const queryClient = useQueryClient()
  const portalClientId = usePortalClientId()
  const resolvedClientId = clientIdProp ?? portalClientId
  const createMut = useCreateVehicle()
  const [decodeSuccess, setDecodeSuccess] = useState(false)
  const [manualEdit, setManualEdit] = useState(false)
  const [createClientOpen, setCreateClientOpen] = useState(false)
  const { data: clientsData } = useClientsList(undefined, 1, 100)
  const clients = clientsData?.items ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fuelType: 'essence',
      year: currentYear,
      mileage: 0,
      clientId: resolvedClientId,
    },
  })

  const fieldsLocked = decodeSuccess && !manualEdit

  useEffect(() => {
    if (open && resolvedClientId) {
      form.setValue('clientId', resolvedClientId)
    }
    if (!open) {
      setCreateClientOpen(false)
      setDecodeSuccess(false)
      setManualEdit(false)
      form.reset({
        fuelType: 'essence',
        year: currentYear,
        mileage: 0,
        clientId: resolvedClientId,
      })
    }
  }, [open, resolvedClientId, form])

  const onSubmit = form.handleSubmit(async (values) => {
    const clientId = showClientSelect ? values.clientId : resolvedClientId
    if (!clientId) {
      toast.error(t('clientPortal:vehicleClientMissing'))
      return
    }
    try {
      const created = await createMut.mutateAsync({
        clientId,
        plate: values.plate,
        make: values.make,
        model: values.model,
        year: values.year,
        vin: values.vin || undefined,
        engine: values.engine || undefined,
        fuelType: values.fuelType,
        mileage: values.mileage,
        color: values.color || undefined,
      })
      toast.success(t('clientPortal:vehicleAdded'))
      onOpenChange(false)
      form.reset()
      setDecodeSuccess(false)
      setManualEdit(false)
      onCreated?.(created.id)
    } catch {
      toast.error(t('clientPortal:vehicleAddError'))
    }
  })

  const autofillCls = vinAutofillFieldClass(decodeSuccess)

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle>{t('clientPortal:addVehicleTitle')}</DialogTitle>
            <DialogDescription>{t('clientPortal:addVehicleDescription')}</DialogDescription>
          </DialogHeader>
          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            {showClientSelect ? (
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <Label htmlFor="clientId">{t('vehicles:associatedClient')}</Label>
                  <select id="clientId" className={selectClass} {...form.register('clientId')}>
                    <option value="">{t('vehicles:selectClient')}</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.phone}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1 text-xs"
                  onClick={() => setCreateClientOpen(true)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {t('vehicles:newClient')}
                </Button>
              </div>
            ) : null}

            <motion.div className="space-y-1">
              <Label htmlFor="plate">{t('clientPortal:vehiclePlate')}</Label>
              <Input id="plate" {...form.register('plate')} className="uppercase" />
              {form.formState.errors.plate ? (
                <p className="text-xs text-clay-red">{form.formState.errors.plate.message}</p>
              ) : null}
            </motion.div>

            <VehicleVinField
              form={form}
              decodeSuccess={decodeSuccess}
              onDecodeSuccessChange={setDecodeSuccess}
              manualEdit={manualEdit}
              onManualEditChange={setManualEdit}
              lockFields
              onDecoded={(data) => applyVinDecode(form, data)}
            />

            <div className="grid grid-cols-2 gap-3">
              <motion.div className="space-y-1">
                <Label htmlFor="make" className="flex items-center gap-1">
                  {t('clientPortal:vehicleMake')}
                  {fieldsLocked ? <Lock className="h-3 w-3 text-ink-muted" aria-hidden /> : null}
                </Label>
                <Input
                  id="make"
                  {...form.register('make')}
                  readOnly={fieldsLocked}
                  className={autofillCls}
                />
              </motion.div>
              <motion.div className="space-y-1">
                <Label htmlFor="model" className="flex items-center gap-1">
                  {t('clientPortal:vehicleModel')}
                  {fieldsLocked ? <Lock className="h-3 w-3 text-ink-muted" aria-hidden /> : null}
                </Label>
                <Input
                  id="model"
                  {...form.register('model')}
                  readOnly={fieldsLocked}
                  className={autofillCls}
                />
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div className="space-y-1">
                <Label htmlFor="year" className="flex items-center gap-1">
                  {t('clientPortal:vehicleYear')}
                  {fieldsLocked ? <Lock className="h-3 w-3 text-ink-muted" aria-hidden /> : null}
                </Label>
                <Input
                  id="year"
                  type="number"
                  {...form.register('year')}
                  readOnly={fieldsLocked}
                  className={autofillCls}
                />
              </motion.div>
              <motion.div className="space-y-1">
                <Label htmlFor="engine" className="flex items-center gap-1">
                  {t('vehicles:engine')}
                  {fieldsLocked ? <Lock className="h-3 w-3 text-ink-muted" aria-hidden /> : null}
                </Label>
                <Input
                  id="engine"
                  {...form.register('engine')}
                  readOnly={fieldsLocked}
                  className={autofillCls}
                />
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div className="space-y-1">
                <Label htmlFor="fuelType" className="flex items-center gap-1">
                  {t('clientPortal:vehicleFuel')}
                  {fieldsLocked ? <Lock className="h-3 w-3 text-ink-muted" aria-hidden /> : null}
                </Label>
                <select
                  id="fuelType"
                  className={cn(selectClass, autofillCls)}
                  disabled={fieldsLocked}
                  {...form.register('fuelType')}
                >
                  <option value="essence">{t('clientPortal:fuelEssence')}</option>
                  <option value="diesel">{t('clientPortal:fuelDiesel')}</option>
                  <option value="hybride">{t('clientPortal:fuelHybrid')}</option>
                  <option value="electrique">{t('clientPortal:fuelElectric')}</option>
                  <option value="autre">{t('vehicles:fuelOther')}</option>
                </select>
              </motion.div>
              <motion.div className="space-y-1">
                <Label htmlFor="color" className="flex items-center gap-1">
                  {t('clientPortal:vehicleColor')}
                  {fieldsLocked ? <Lock className="h-3 w-3 text-ink-muted" aria-hidden /> : null}
                </Label>
                <Input
                  id="color"
                  {...form.register('color')}
                  readOnly={fieldsLocked}
                  className={autofillCls}
                />
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div className="space-y-1">
                <Label htmlFor="transmission" className="flex items-center gap-1">
                  {t('vehicles:transmission')}
                  {fieldsLocked ? <Lock className="h-3 w-3 text-ink-muted" aria-hidden /> : null}
                </Label>
                <Input
                  id="transmission"
                  {...form.register('transmission')}
                  readOnly={fieldsLocked}
                  className={autofillCls}
                />
              </motion.div>
              <motion.div className="space-y-1">
                <Label htmlFor="bodyType" className="flex items-center gap-1">
                  {t('vehicles:bodyType')}
                  {fieldsLocked ? <Lock className="h-3 w-3 text-ink-muted" aria-hidden /> : null}
                </Label>
                <Input
                  id="bodyType"
                  {...form.register('bodyType')}
                  readOnly={fieldsLocked}
                  className={autofillCls}
                />
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div className="space-y-1">
                <Label htmlFor="doors" className="flex items-center gap-1">
                  {t('vehicles:doors')}
                  {fieldsLocked ? <Lock className="h-3 w-3 text-ink-muted" aria-hidden /> : null}
                </Label>
                <Input
                  id="doors"
                  type="number"
                  min={0}
                  {...form.register('doors')}
                  readOnly={fieldsLocked}
                  className={autofillCls}
                />
              </motion.div>
              <motion.div className="space-y-1">
                <Label htmlFor="power" className="flex items-center gap-1">
                  {t('vehicles:power')}
                  {fieldsLocked ? <Lock className="h-3 w-3 text-ink-muted" aria-hidden /> : null}
                </Label>
                <Input
                  id="power"
                  type="number"
                  min={0}
                  step="0.1"
                  {...form.register('power')}
                  readOnly={fieldsLocked}
                  className={autofillCls}
                />
              </motion.div>
            </div>

            <motion.div className="space-y-1">
              <Label htmlFor="mileage">{t('clientPortal:vehicleMileage')}</Label>
              <Input id="mileage" type="number" {...form.register('mileage')} />
            </motion.div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t('common:cancel')}
              </Button>
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t('clientPortal:vehicleSave')}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>

    <CreateClientDialog
      open={createClientOpen}
      onOpenChange={setCreateClientOpen}
      onCreated={(client) => {
        void queryClient.invalidateQueries({ queryKey: ['clients'] })
        setTimeout(() => {
          form.setValue('clientId', client.id)
        }, 300)
      }}
    />
    </>
  )
}
