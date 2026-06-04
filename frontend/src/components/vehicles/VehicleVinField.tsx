import axios from 'axios'
import {
  AlertCircle,
  Calendar,
  Car,
  CheckCircle2,
  Fuel,
  Loader2,
  Lock,
  Search,
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import type { UseFormReturn, FieldValues, Path } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import type { VinDecodeResult, VinMatch } from '@/hooks/api/useVehicles'
import { fetchVinDecodeWithMatch, fetchVinMatches } from '@/hooks/api/useVehicles'
import { cn } from '@/lib/utils'

export type VehicleVinFieldProps<T extends FieldValues> = {
  form: UseFormReturn<T>
  vinName?: Path<T>
  onDecoded?: (data: VinDecodeResult) => void
  lockFields?: boolean
  decodeSuccess?: boolean
  onDecodeSuccessChange?: (success: boolean) => void
  manualEdit?: boolean
  onManualEditChange?: (manual: boolean) => void
}

function mapFuelToEnum(
  raw: string,
): 'essence' | 'diesel' | 'hybride' | 'electrique' | 'autre' | undefined {
  const u = raw.toLowerCase()
  if (u.includes('elect') || u.includes('élect')) return 'electrique'
  if (u.includes('diesel') || u.includes('gazole')) return 'diesel'
  if (u.includes('hybr')) return 'hybride'
  if (u.includes('essence') || u.includes('petrol') || u.includes('gasoline')) return 'essence'
  if (!raw.trim()) return undefined
  return 'autre'
}

export { mapFuelToEnum }

export function VehicleVinField<T extends FieldValues>({
  form,
  vinName = 'vin' as Path<T>,
  onDecoded,
  lockFields = false,
  decodeSuccess: decodeSuccessProp,
  onDecodeSuccessChange,
  manualEdit: isManualEdit,
  onManualEditChange,
}: VehicleVinFieldProps<T>) {
  const { t } = useTranslation(['vehicles', 'clientPortal', 'common'])
  const [decodeSuccessLocal, setDecodeSuccessLocal] = useState(false)
  const [decodeError, setDecodeError] = useState<string | null>(null)
  const [matches, setMatches] = useState<VinMatch[]>([])
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [isLoadingMatches, setIsLoadingMatches] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const decodeSuccess = decodeSuccessProp ?? decodeSuccessLocal
  const setDecodeSuccess = onDecodeSuccessChange ?? setDecodeSuccessLocal

  const watchVin = form.watch(vinName) as string | undefined

  const handleConfirmMatch = async (match: VinMatch) => {
    const vin = String(form.getValues(vinName) ?? '').trim().toUpperCase()
    setIsConfirming(true)
    try {
      const data = await fetchVinDecodeWithMatch(vin, {
        id: match.id,
        recordType: match.recordType,
      })
      form.setValue(vinName, vin as never)
      onDecoded?.(data)
      setDecodeSuccess(true)
      setShowMatchModal(false)
      setMatches([])
      setSelectedMatchId(null)
      toast.success(t('vehicles:vinDecodeAutorefSuccess'))
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : t('vehicles:vinDecodeError')
      setDecodeError(msg)
      toast.error(msg)
      setShowMatchModal(false)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleVinDecode = async () => {
    const vin = String(form.getValues(vinName) ?? '').trim().toUpperCase()
    if (!vin || vin.length !== 17) return

    setIsLoadingMatches(true)
    setDecodeSuccess(false)
    setDecodeError(null)
    setMatches([])
    setSelectedMatchId(null)
    onManualEditChange?.(false)

    try {
      const list = await fetchVinMatches(vin)

      if (list.length === 0) {
        setDecodeError(t('vehicles:vinNoMatches'))
        return
      }

      if (list.length === 1 && list[0]) {
        await handleConfirmMatch(list[0])
        return
      }

      setMatches(list)
      setShowMatchModal(true)
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : t('vehicles:vinDecodeError')
      setDecodeError(msg)
      toast.error(msg)
    } finally {
      setIsLoadingMatches(false)
    }
  }

  const vinRegister = form.register(vinName, {
    onChange: (e) => {
      const v = (e.target as HTMLInputElement).value.toUpperCase().replace(/\s/g, '')
      ;(e.target as HTMLInputElement).value = v
    },
  })

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={String(vinName)} className="text-sm font-medium text-ink-primary">
          {t('vehicles:vin')}
        </Label>
        <span className="flex items-center gap-1 text-xs text-ink-muted">
          <span>{t('vehicles:decodePoweredBy')}</span>
          <span className="font-semibold text-clay-primary">Autoref</span>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay-green" aria-hidden />
        </span>
      </div>

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            id={String(vinName)}
            {...vinRegister}
            placeholder="Ex: WP1ZZZ95ZKLB15431"
            maxLength={17}
            className={cn(
              'font-mono uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal',
              'pe-12',
            )}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase().replace(/\s/g, '')
              void vinRegister.onChange(e)
              setDecodeSuccess(false)
              setDecodeError(null)
            }}
          />
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 font-mono text-xs text-ink-muted">
            {(watchVin?.length ?? 0)}/17
          </span>
        </div>
        <Button
          type="button"
          disabled={
            !watchVin || watchVin.length !== 17 || isLoadingMatches || isConfirming
          }
          onClick={() => void handleVinDecode()}
          className="shrink-0"
        >
          {isLoadingMatches ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('vehicles:searching')}
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              {t('vehicles:decode')}
            </>
          )}
        </Button>
      </div>

      {decodeSuccess ? (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
            'border-clay-green/40 bg-clay-green/10 text-clay-green',
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{t('vehicles:vinDecodeAutorefBanner')}</span>
        </div>
      ) : null}

      {decodeError ? (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
            'border-clay-red/40 bg-clay-red/10 text-clay-red',
          )}
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{decodeError}</span>
        </div>
      ) : null}

      {lockFields && decodeSuccess && !isManualEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto gap-1 px-0 text-xs text-ink-secondary"
          onClick={() => onManualEditChange?.(true)}
        >
          <Lock className="h-3 w-3" />
          {t('vehicles:editManually')}
        </Button>
      ) : null}

      <Dialog open={showMatchModal} onOpenChange={setShowMatchModal}>
        <DialogContent className="flex max-h-[85vh] max-w-md flex-col overflow-hidden p-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="border-b border-[var(--border)] px-6 pb-4 pt-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-semibold text-ink-primary">
                  <Car className="h-4 w-4 text-clay-primary" />
                  {t('vehicles:vinSelectMatch')}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-ink-secondary">
                  {matches.length} {t('vehicles:vinMatchesFound')}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {matches.map((m) => {
                const isSelected = selectedMatchId === m.id
                const powerLabel =
                  m.powerCh > 0
                    ? `${m.powerCh}ch · ${m.powerKw}kW`
                    : m.powerKw > 0
                      ? `${m.powerKw}kW`
                      : null
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMatchId(m.id)}
                    className={cn(
                      'w-full cursor-pointer rounded-[var(--radius-card)] border p-4 text-left transition-all duration-150',
                      isSelected
                        ? 'border-clay-primary bg-clay-primary/5 shadow-clay-hover ring-1 ring-clay-primary/20'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-clay-primary/50 hover:bg-[var(--bg-sidebar)] hover:shadow-clay',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                          isSelected
                            ? 'bg-clay-primary/10 text-clay-primary'
                            : 'bg-[var(--bg-sidebar)] text-ink-muted',
                        )}
                      >
                        <Car className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink-primary">{m.make}</p>
                        <p className="text-sm leading-snug text-ink-secondary">{m.model}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.year > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-sidebar)] px-2 py-0.5 text-xs font-medium text-ink-secondary">
                              <Calendar className="h-3 w-3" />
                              {m.year}
                            </span>
                          ) : null}
                          {powerLabel ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-sidebar)] px-2 py-0.5 text-xs font-medium text-ink-secondary">
                              <Zap className="h-3 w-3" />
                              {powerLabel}
                            </span>
                          ) : null}
                          {m.fuelType ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-sidebar)] px-2 py-0.5 text-xs font-medium text-ink-secondary">
                              <Fuel className="h-3 w-3" />
                              {m.fuelType}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-clay-primary" />
                      ) : (
                        <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-[var(--border)]" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2 border-t border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setShowMatchModal(false)}
              >
                {t('common:cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                disabled={!selectedMatchId || isConfirming}
                onClick={() => {
                  const match = matches.find((m) => m.id === selectedMatchId)
                  if (match) void handleConfirmMatch(match)
                }}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('vehicles:decoding')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {t('vehicles:vinMatchConfirm')}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function vinAutofillFieldClass(decoded: boolean): string {
  return cn(
    decoded && 'border-clay-primary/30 bg-clay-primary/5 dark:bg-clay-primary/10',
  )
}
