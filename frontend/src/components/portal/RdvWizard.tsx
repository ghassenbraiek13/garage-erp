import { addMinutes, format } from 'date-fns'
import { arSA, fr } from 'date-fns/locale'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AddVehicleModal } from '@/components/portal/AddVehicleModal'
import { PortalServiceGrid } from '@/components/portal/PortalServiceGrid'
import { RdvSlotPicker } from '@/components/portal/RdvSlotPicker'
import {
  buildNotesWithPrestation,
  defaultPrestationKey,
  getDefaultPrestationByKey,
  parsePrestationKey,
} from '@/components/planning/rdvPrestations'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useCreateAppointment } from '@/hooks/api/useAppointments'
import { useServicesList } from '@/hooks/api/useServices'
import type { ApiVehicle } from '@/hooks/api/useVehicles'
import { usePortalClientId, usePortalVehicles } from '@/hooks/usePortalClient'
import { cn } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'

const STEP_LABELS = ['vehicle', 'service', 'slot', 'notes', 'confirm'] as const

export type RdvWizardProps = {
  mode: 'page' | 'modal'
  initialVehicleId?: string
  onClose?: () => void
}

export function RdvWizard({ mode, initialVehicleId, onClose }: RdvWizardProps) {
  const { t } = useTranslation('clientPortal')
  const locale = useLocaleStore((s) => s.locale)
  const dateLocale = locale === 'ar' ? arSA : fr
  const navigate = useNavigate()
  const clientId = usePortalClientId()
  const { data: vehicles = [], refetch: refetchVehicles } = usePortalVehicles()
  const { data: servicesData } = useServicesList(1, 200)
  const garageServices = servicesData?.items ?? []
  const createMut = useCreateAppointment()

  const skipVehicleStep = Boolean(initialVehicleId)
  const [step, setStep] = useState(skipVehicleStep ? 2 : 1)
  const [vehicleId, setVehicleId] = useState<string | null>(initialVehicleId ?? null)
  const [prestationKey, setPrestationKey] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null)
  const [notes, setNotes] = useState('')
  const [slotView, setSlotView] = useState<'grid' | 'list'>('grid')
  const [weekOffset, setWeekOffset] = useState(0)
  const [addVehicleOpen, setAddVehicleOpen] = useState(false)

  useEffect(() => {
    if (initialVehicleId) {
      setVehicleId(initialVehicleId)
      setStep(2)
    }
  }, [initialVehicleId])

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId)
  const parsed = parsePrestationKey(prestationKey)
  const garageService =
    parsed?.kind === 'garage' ? garageServices.find((s) => s.id === parsed.id) : undefined
  const defaultPrestation = getDefaultPrestationByKey(prestationKey)
  const serviceIdForSlots = parsed?.kind === 'garage' ? parsed.id : garageServices[0]?.id

  const notesPlaceholder = useMemo(() => {
    if (prestationKey === defaultPrestationKey('Diagnostic général')) return t('notesPlaceholderGeneral')
    if (prestationKey === defaultPrestationKey('Diagnostic avant achat')) return t('notesPlaceholderPrePurchase')
    return t('notesPlaceholderDefault')
  }, [prestationKey, t])

  const canNext = useMemo(() => {
    if (step === 1) return Boolean(vehicleId)
    if (step === 2) return Boolean(prestationKey)
    if (step === 3) return Boolean(selectedSlot)
    if (step === 4) return true
    return true
  }, [step, vehicleId, prestationKey, selectedSlot])

  const serviceLabel = useMemo(() => {
    if (garageService) return garageService.name
    if (defaultPrestation) return defaultPrestation.label
    return '—'
  }, [garageService, defaultPrestation])

  const submit = async () => {
    if (!clientId || !vehicleId || !selectedSlot) return
    let serviceId: string | undefined
    let finalNotes = notes.trim()
    if (parsed?.kind === 'garage' && parsed.id) {
      serviceId = parsed.id
    } else if (defaultPrestation) {
      finalNotes = buildNotesWithPrestation(defaultPrestation.label, notes)
    }
    const duration = garageService?.duration ?? 30
    const end = addMinutes(selectedSlot, duration)
    try {
      await createMut.mutateAsync({
        clientId,
        vehicleId,
        serviceId,
        start: selectedSlot.toISOString(),
        end: end.toISOString(),
        notes: finalNotes || undefined,
      })
      toast.success(t('rdvConfirmed'))
      if (mode === 'modal') onClose?.()
      else navigate('/portal')
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error(t('rdvConflict'))
        setStep(3)
        return
      }
      toast.error(t('rdvError'))
    }
  }

  const renderVehicleStep = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {vehicles.map((v) => (
          <VehiclePickCard
            key={v.id}
            vehicle={v}
            selected={vehicleId === v.id}
            onSelect={() => setVehicleId(v.id)}
          />
        ))}
        <button
          type="button"
          onClick={() => setAddVehicleOpen(true)}
          className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-sidebar)] p-4 text-sm font-semibold text-clay-primary hover:border-clay-primary"
        >
          <Plus className="h-6 w-6" />
          {t('addVehicleCard')}
        </button>
      </div>
    </div>
  )

  const stepContent = () => {
    switch (step) {
      case 1:
        return renderVehicleStep()
      case 2:
        return (
          <PortalServiceGrid
            value={prestationKey}
            onChange={setPrestationKey}
            garageServices={garageServices}
          />
        )
      case 3:
        return (
          <RdvSlotPicker
            serviceId={serviceIdForSlots}
            selected={selectedSlot}
            onSelect={setSelectedSlot}
            view={slotView}
            onViewChange={setSlotView}
            weekOffset={weekOffset}
            onWeekOffsetChange={setWeekOffset}
          />
        )
      case 4:
        return (
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder={notesPlaceholder}
            aria-label={t('notesLabel')}
          />
        )
      case 5:
        return (
          <ClayCard variant="elevated">
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="text-base font-semibold text-ink-primary">{t('rdvSummaryTitle')}</p>
              <SummaryRow label={t('summaryVehicle')} value={formatVehicle(selectedVehicle)} />
              <SummaryRow label={t('summaryService')} value={serviceLabel} />
              <SummaryRow
                label={t('summaryDate')}
                value={
                  selectedSlot
                    ? format(selectedSlot, 'EEEE d MMMM yyyy', { locale: dateLocale })
                    : '—'
                }
              />
              <SummaryRow
                label={t('summaryTime')}
                value={selectedSlot ? format(selectedSlot, 'HH:mm') : '—'}
              />
              {notes.trim() ? <SummaryRow label={t('summaryNotes')} value={notes.trim()} /> : null}
            </CardContent>
          </ClayCard>
        )
      default:
        return null
    }
  }

  const body = (
    <motion.div className="space-y-6">
      <WizardProgress step={step} skipVehicle={skipVehicleStep} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          {stepContent()}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--border)] pt-4">
        <Button
          type="button"
          variant="ghost"
          disabled={step <= (skipVehicleStep ? 2 : 1)}
          onClick={() => setStep((s) => s - 1)}
        >
          {t('wizardBack')}
        </Button>
        {step < 5 ? (
          <Button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            {t('wizardNext')}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(3)}>
              {t('wizardEdit')}
            </Button>
            <Button type="button" disabled={createMut.isPending} onClick={() => void submit()}>
              {t('wizardConfirm')}
            </Button>
          </div>
        )}
      </div>

      <AddVehicleModal
        open={addVehicleOpen}
        onOpenChange={setAddVehicleOpen}
        onCreated={(id) => {
          void refetchVehicles()
          setVehicleId(id)
        }}
      />
    </motion.div>
  )

  if (mode === 'page') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-ink-primary">{t('bookRdvTitle')}</h1>
        {body}
      </div>
    )
  }

  return body
}

function WizardProgress({ step, skipVehicle }: { step: number; skipVehicle: boolean }) {
  const { t } = useTranslation('clientPortal')
  return (
    <div className="space-y-2">
      <motion.div className="flex gap-1">
        {STEP_LABELS.map((key, i) => {
          const n = i + 1
          const active = step >= n
          return (
            <motion.div
              key={key}
              className={cn('h-1.5 flex-1 rounded-full transition-colors', active ? 'bg-clay-primary' : 'bg-[var(--border)]')}
            />
          )
        })}
      </motion.div>
      <div className="flex flex-wrap justify-between gap-1 text-[11px] font-medium text-ink-muted">
        {STEP_LABELS.map((key, i) => {
          const n = i + 1
          if (skipVehicle && n === 1) return null
          return (
            <span key={key} className={cn(step === n && 'text-clay-primary')}>
              {t(`wizardStep.${key}`)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function VehiclePickCard({
  vehicle,
  selected,
  onSelect,
}: {
  vehicle: ApiVehicle
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative rounded-2xl border p-4 text-start transition-all',
        selected
          ? 'border-clay-primary bg-clay-primary/10 ring-2 ring-clay-primary'
          : 'border-[var(--border)] bg-[var(--bg-sidebar)] hover:border-clay-primary/40',
      )}
    >
      {selected ? (
        <Check className="absolute end-3 top-3 h-5 w-5 text-clay-primary" aria-hidden />
      ) : null}
      <p className="font-semibold text-ink-primary">
        {vehicle.make} {vehicle.model} {vehicle.year ?? ''}
      </p>
      <p className="text-sm text-ink-muted">{vehicle.plate}</p>
    </button>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="min-w-[100px] font-medium text-ink-muted">{label}</span>
      <span className="text-ink-primary">{value}</span>
    </div>
  )
}

function formatVehicle(v: ApiVehicle | undefined): string {
  if (!v) return '—'
  return `${v.make} ${v.model}${v.year ? ` ${v.year}` : ''}`
}
