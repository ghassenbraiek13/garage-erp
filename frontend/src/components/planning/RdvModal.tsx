import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { addMinutes, format, startOfDay } from 'date-fns'
import { arSA, fr } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Info } from 'lucide-react'
import { RdvPrestationSelect, getDiagnosticHintKey } from '@/components/planning/RdvPrestationSelect'
import {
  buildNotesWithPrestation,
  getDefaultPrestationByKey,
  parsePrestationKey,
} from '@/components/planning/rdvPrestations'
import { roundDownToNearestSlot, TimeSelect } from '@/components/planning/TimeSelect'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateAppointment } from '@/hooks/api/useAppointments'
import { useClientsList, useCreateClient } from '@/hooks/api/useClients'
import { useServicesList } from '@/hooks/api/useServices'
import { useClientVehicles, useCreateVehicle } from '@/hooks/api/useVehicles'
import { useMechanics } from '@/hooks/api/useUsers'
import { cn } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'

const selectClassName = cn(
  'flex h-11 w-full min-h-11 rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm text-ink-primary shadow-inner backdrop-blur-clay backdrop-saturate-[180] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:cursor-not-allowed disabled:opacity-50',
)

function combineLocalDateAndTime(d: Date, timeHHmm: string): Date {
  const [hh, mm] = timeHHmm.split(':').map(Number)
  const out = new Date(d)
  out.setHours(hh, mm, 0, 0)
  return out
}

const durationValues = [30, 45, 60, 90, 120, 150, 180] as const
const phoneRe = /^(\+33|0)[1-9](\d{8})$/
const maxYear = new Date().getFullYear() + 1

function buildSchema(t: (k: string) => string) {
  const common = {
    date: z.date(),
    startTime: z
      .string()
      .min(1, t('rdvErrorStartTime'))
      .regex(/^\d{2}:\d{2}$/, t('rdvErrorStartTime')),
    duration: z.coerce
      .number()
      .refine((n) => (durationValues as readonly number[]).includes(n), { message: t('rdvErrorDuration') }),
    mechanicId: z.string().min(1, t('rdvErrorMechanic')),
    prestationKey: z.string().min(1, t('rdvErrorService')),
    notes: z.string().optional(),
  }

  /* discriminatedUnion exige des ZodObject bruts — pas de .superRefine() sur chaque branche */
  const existing = z.object({
    mode: z.literal('existing'),
    clientId: z.string().min(1, t('rdvErrorClient')),
    vehicleId: z.string().min(1, t('rdvErrorVehicle')),
    ...common,
  })

  const newClient = z.object({
    mode: z.literal('new'),
    newName: z.string().min(2, t('rdvErrorNewName')),
    newPhone: z.string().regex(phoneRe, t('rdvErrorPhone')),
    newEmail: z.union([z.literal(''), z.string().email()]).optional(),
    vPlate: z.string().min(4, t('rdvErrorVehiclePlate')),
    vMake: z.string().min(2, t('rdvErrorVehicleMake')),
    vModel: z.string().min(1, t('rdvErrorVehicleModel')),
    vYear: z.coerce.number().int().min(1950).max(maxYear),
    ...common,
  })

  return z
    .discriminatedUnion('mode', [existing, newClient])
    .superRefine((data, ctx) => {
      const day = startOfDay(data.date)
      const today = startOfDay(new Date())
      if (day < today) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('rdvErrorDatePast'), path: ['date'] })
      }
    })
}

export interface RdvModalProps {
  open: boolean
  onClose: () => void
  defaultDate?: Date
  defaultTime?: string
  lockDate?: boolean
  lockTime?: boolean
}

export function RdvModal({ open, onClose, defaultDate, defaultTime, lockDate }: RdvModalProps) {
  const { t } = useTranslation(['planning', 'rdv', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const dateLocale = locale === 'ar' ? arSA : fr

  const schema = useMemo(() => buildSchema((k) => t(`planning:${k}`)), [t])
  type FormValues = z.infer<typeof schema>

  const createMut = useCreateAppointment()
  const createClientMut = useCreateClient()
  const createVehicleMut = useCreateVehicle()
  const { data: mechanics } = useMechanics()
  const { data: servicesData } = useServicesList(1, 200)

  const [clientSearch, setClientSearch] = useState('')
  const [pickedClientName, setPickedClientName] = useState('')
  const deferredSearch = useDeferredValue(clientSearch)
  const { data: clientsData } = useClientsList(deferredSearch.trim() || undefined, 1, 50)

  const emptyDefaults = {
    mode: 'existing' as const,
    clientId: '',
    vehicleId: '',
    newName: '',
    newPhone: '',
    newEmail: '',
    vPlate: '',
    vMake: '',
    vModel: '',
    vYear: new Date().getFullYear(),
    date: new Date(),
    startTime: '',
    duration: 60,
    mechanicId: '',
    prestationKey: '',
    notes: '',
  } as FormValues

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    shouldUnregister: false,
    defaultValues: emptyDefaults,
  })

  const { control, register, handleSubmit, reset, setValue, watch, formState } = form
  const fieldErr = (name: string) =>
    (formState.errors as Record<string, { message?: string } | undefined>)[name]?.message
  const mode = watch('mode')
  const clientId = useWatch({ control, name: 'clientId', defaultValue: '' })
  const watchDate = useWatch({ control, name: 'date' })
  const watchStartTime = useWatch({ control, name: 'startTime' })
  const watchDuration = useWatch({ control, name: 'duration' })
  const watchPrestationKey = useWatch({ control, name: 'prestationKey' })
  const diagnosticHint = getDiagnosticHintKey(watchPrestationKey ?? '')

  const { data: vehicles } = useClientVehicles(mode === 'existing' && clientId ? clientId : undefined)

  useEffect(() => {
    if (!open) return
    const baseDate = defaultDate ? startOfDay(defaultDate) : startOfDay(new Date())
    const timeRounded =
      defaultTime !== undefined ? roundDownToNearestSlot(defaultTime) || '08:00' : ''
    reset({
      ...emptyDefaults,
      date: baseDate,
      startTime: timeRounded,
    })
    setClientSearch('')
    setPickedClientName('')
    if (lockDate && defaultDate) {
      setValue('date', startOfDay(defaultDate))
    }
  }, [open, defaultDate, defaultTime, lockDate, reset, setValue])

  useEffect(() => {
    if (mode === 'existing') {
      setValue('vehicleId', '')
    }
  }, [clientId, mode, setValue])

  const endPreview = useMemo(() => {
    if (!watchDate || !watchStartTime || !/^\d{2}:\d{2}$/.test(watchStartTime)) return null
    const start = combineLocalDateAndTime(watchDate, watchStartTime)
    const end = addMinutes(start, watchDuration ?? 60)
    return format(end, 'HH:mm', { locale: dateLocale })
  }, [watchDate, watchStartTime, watchDuration, dateLocale])

  const parseConflictToast = (e: unknown): string => {
    if (!axios.isAxiosError(e)) return t('planning:rdvErrorGeneric')
    const res = e.response
    const payload = res?.data as
      | { code?: string; message?: string; data?: { conflictingStart?: string; conflictingEnd?: string } }
      | undefined
    if (res?.status === 409 && payload?.code === 'SLOT_CONFLICT') {
      const startIso = payload.data?.conflictingStart
      if (startIso) {
        try {
          const slotLabel = format(new Date(startIso), 'PPp', { locale: dateLocale })
          return t('planning:slotConflictToast', { slot: slotLabel })
        } catch {
          return payload.message ?? t('planning:slotConflict')
        }
      }
      return payload.message ?? t('planning:slotConflict')
    }
    if (payload?.message && typeof payload.message === 'string') return payload.message
    return t('planning:rdvErrorGeneric')
  }

  const onSubmit = async (values: FormValues) => {
    const start = combineLocalDateAndTime(values.date, values.startTime)
    const end = addMinutes(start, values.duration)

    try {
      let finalClientId = ''
      let finalVehicleId = ''

      if (values.mode === 'new') {
        const clientRow = await createClientMut.mutateAsync({
          name: values.newName,
          phone: values.newPhone,
          email: values.newEmail?.trim() || undefined,
        })
        finalClientId = String((clientRow as { id?: string }).id ?? '')
        const veh = await createVehicleMut.mutateAsync({
          clientId: finalClientId,
          plate: values.vPlate.trim(),
          make: values.vMake.trim(),
          model: values.vModel.trim(),
          year: values.vYear,
          fuelType: 'essence',
        })
        finalVehicleId = veh.id
      } else {
        finalClientId = values.clientId
        finalVehicleId = values.vehicleId
      }

      const parsed = parsePrestationKey(values.prestationKey)
      let serviceId: string | undefined
      let notes = values.notes?.trim() || undefined
      if (parsed?.kind === 'garage' && parsed.id) {
        serviceId = parsed.id
      } else if (parsed?.kind === 'default' && parsed.label) {
        notes = buildNotesWithPrestation(parsed.label, notes)
      }

      await createMut.mutateAsync({
        clientId: finalClientId,
        vehicleId: finalVehicleId,
        serviceId,
        mechanicId: values.mechanicId,
        start: start.toISOString(),
        end: end.toISOString(),
        notes,
      })
      toast.success(t('planning:rdvCreated'))
      onClose()
    } catch (e) {
      toast.error(parseConflictToast(e))
    }
  }

  const clients = clientsData?.items ?? []
  const services = servicesData?.items ?? []
  const allowEmptyTime = defaultTime === undefined

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="max-h-[min(90vh,720px)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('planning:rdvModalTitle')}</DialogTitle>
          <DialogDescription>{t('planning:rdvModalDescription')}</DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'existing' ? 'primary' : 'secondary'}
                className="flex-1"
                onClick={() => {
                  setValue('mode', 'existing', { shouldValidate: true })
                }}
              >
                {t('planning:clientModeExisting')}
              </Button>
              <Button
                type="button"
                variant={mode === 'new' ? 'primary' : 'secondary'}
                className="flex-1"
                onClick={() => {
                  setValue('mode', 'new', { shouldValidate: true })
                  setValue('clientId', '')
                  setValue('vehicleId', '')
                  setPickedClientName('')
                  setClientSearch('')
                }}
              >
                {t('planning:clientModeNew')}
              </Button>
            </div>

            {mode === 'existing' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rdv-client-search">{t('planning:fieldClient')}</Label>
                  <input type="hidden" {...register('clientId')} />
                  {clientId ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-table-header)] px-3 py-2">
                      <span className="text-sm font-medium text-ink-primary">{pickedClientName || clientId}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          setValue('clientId', '', { shouldValidate: true })
                          setPickedClientName('')
                          setClientSearch('')
                        }}
                      >
                        {t('planning:changeSelection')}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        id="rdv-client-search"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder={t('planning:searchClientPlaceholder')}
                        autoComplete="off"
                      />
                      <ul
                        className="max-h-36 overflow-y-auto rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-input)] p-1"
                        role="listbox"
                      >
                        {clients.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              className="w-full rounded-lg px-3 py-2 text-start text-sm text-ink-primary hover:bg-[var(--bg-table-hover)]"
                              onClick={() => {
                                setValue('clientId', c.id, { shouldValidate: true })
                                setPickedClientName(c.name)
                                setClientSearch('')
                              }}
                            >
                              {c.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {fieldErr('clientId') ? (
                    <p className="text-xs text-clay-red">{fieldErr('clientId')}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rdv-vehicle">{t('planning:fieldVehicle')}</Label>
                  <select id="rdv-vehicle" className={selectClassName} {...register('vehicleId')} disabled={!clientId}>
                    <option value="">{t('planning:selectVehicle')}</option>
                    {(vehicles ?? []).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} — {v.make} {v.model}
                      </option>
                    ))}
                  </select>
                  {fieldErr('vehicleId') ? (
                    <p className="text-xs text-clay-red">{fieldErr('vehicleId')}</p>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="space-y-3 rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-table-header)] p-3">
                <p className="text-sm font-medium text-ink-primary">{t('planning:newClientSection')}</p>
                <div className="space-y-2">
                  <Label htmlFor="rdv-nn">{t('planning:newClientName')}</Label>
                  <Input id="rdv-nn" {...register('newName')} autoComplete="name" />
                  {fieldErr('newName') ? (
                    <p className="text-xs text-clay-red">{fieldErr('newName')}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rdv-np">{t('planning:newClientPhone')}</Label>
                  <Input id="rdv-np" {...register('newPhone')} inputMode="tel" autoComplete="tel" placeholder="0612345678" />
                  {fieldErr('newPhone') ? (
                    <p className="text-xs text-clay-red">{fieldErr('newPhone')}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rdv-ne">{t('planning:newClientEmail')}</Label>
                  <Input id="rdv-ne" type="email" {...register('newEmail')} autoComplete="email" />
                </div>
                <p className="pt-1 text-sm font-medium text-ink-primary">{t('planning:newVehicleSection')}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rdv-vp">{t('planning:fieldPlate')}</Label>
                    <Input id="rdv-vp" {...register('vPlate')} autoComplete="off" />
                    {fieldErr('vPlate') ? (
                      <p className="text-xs text-clay-red">{fieldErr('vPlate')}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rdv-vy">{t('planning:fieldYear')}</Label>
                    <Input id="rdv-vy" type="number" {...register('vYear', { valueAsNumber: true })} min={1950} max={maxYear} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="rdv-vmk">{t('planning:fieldMake')}</Label>
                    <Input id="rdv-vmk" {...register('vMake')} />
                    {fieldErr('vMake') ? (
                      <p className="text-xs text-clay-red">{fieldErr('vMake')}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="rdv-vmd">{t('planning:fieldModel')}</Label>
                    <Input id="rdv-vmd" {...register('vModel')} />
                    {fieldErr('vModel') ? (
                      <p className="text-xs text-clay-red">{fieldErr('vModel')}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('planning:fieldDate')}</Label>
              {lockDate && defaultDate ? (
                <div
                  className={cn(
                    'flex min-h-11 items-center rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-table-header)] px-3 text-sm text-ink-primary',
                  )}
                >
                  {format(startOfDay(defaultDate), 'PPP', { locale: dateLocale })}
                </div>
              ) : (
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <Input
                      type="date"
                      value={format(field.value, 'yyyy-MM-dd')}
                      min={format(startOfDay(new Date()), 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const d = new Date(e.target.value + 'T12:00:00')
                        field.onChange(startOfDay(d))
                      }}
                    />
                  )}
                />
              )}
              {formState.errors.date ? (
                <p className="text-xs text-clay-red">{formState.errors.date.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rdv-start">{t('planning:fieldStartTime')}</Label>
              <Controller
                control={control}
                name="startTime"
                render={({ field }) => (
                  <TimeSelect
                    id="rdv-start"
                    value={field.value}
                    onChange={field.onChange}
                    allowEmpty={allowEmptyTime}
                    emptyLabel={t('planning:selectTimePlaceholder')}
                  />
                )}
              />
              {formState.errors.startTime ? (
                <p className="text-xs text-clay-red">{formState.errors.startTime.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rdv-duration">{t('planning:fieldDuration')}</Label>
              <select id="rdv-duration" className={selectClassName} {...register('duration', { valueAsNumber: true })}>
                {durationValues.map((m) => (
                  <option key={m} value={m}>
                    {t('planning:durationMinutes', { count: m })}
                  </option>
                ))}
              </select>
              {endPreview ? (
                <p className="text-xs text-ink-secondary">{t('planning:endHint', { time: endPreview })}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rdv-mechanic">{t('planning:fieldMechanic')}</Label>
              <select id="rdv-mechanic" className={selectClassName} {...register('mechanicId')}>
                <option value="">{t('planning:selectMechanic')}</option>
                {(mechanics ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {formState.errors.mechanicId ? (
                <p className="text-xs text-clay-red">{formState.errors.mechanicId.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rdv-service">{t('planning:fieldService')}</Label>
              <RdvPrestationSelect
                id="rdv-service"
                value={watchPrestationKey ?? ''}
                onChange={(key) => {
                  setValue('prestationKey', key, { shouldValidate: true })
                  const def = getDefaultPrestationByKey(key)
                  if (def?.label === 'Diagnostic général' || def?.label === 'Diagnostic avant achat') {
                    setValue('duration', 60, { shouldValidate: true })
                  }
                }}
                garageServices={services}
                placeholder={t('planning:selectService')}
              />
              {formState.errors.prestationKey ? (
                <p className="text-xs text-clay-red">{formState.errors.prestationKey.message}</p>
              ) : null}
              {diagnosticHint ? (
                <div
                  className={cn(
                    'flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700',
                    'dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-300',
                  )}
                >
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <p>{t(`rdv:hint.${diagnosticHint}`)}</p>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rdv-notes">{t('planning:fieldNotes')}</Label>
              <Textarea id="rdv-notes" rows={3} {...register('notes')} placeholder={t('planning:notesPlaceholder')} />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                {t('common:cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createMut.isPending || createClientMut.isPending || createVehicleMut.isPending}
              >
                {t('planning:createRdv')}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
