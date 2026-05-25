import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useClientsList } from '@/hooks/api/useClients'
import { useServicesList } from '@/hooks/api/useServices'
import { useMechanics } from '@/hooks/api/useUsers'
import { useClientVehicles } from '@/hooks/api/useVehicles'
import { cn, formatCurrencyEUR } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'
import {
  type RepairFormValues,
  selectClass,
} from '@/components/repairs/repairFormTypes'

type RepairFormFieldsProps = {
  form: UseFormReturn<RepairFormValues>
}

export function RepairFormFields({ form }: RepairFormFieldsProps): React.ReactElement {
  const { t } = useTranslation(['repairs', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const [clientSearch, setClientSearch] = useState('')
  const [planOpen, setPlanOpen] = useState(false)

  const { data: clientsData } = useClientsList(clientSearch || undefined, 1, 100)
  const clientId = form.watch('clientId')
  const { data: vehicles = [] } = useClientVehicles(clientId || undefined, 'garage')
  const { data: servicesQuery } = useServicesList(1, 200)
  const services = servicesQuery?.items ?? []
  const { data: mechanics = [] } = useMechanics()
  const serviceIds = form.watch('serviceIds') ?? []

  useEffect(() => {
    if (!clientId) return
    const currentVehicle = form.getValues('vehicleId')
    if (currentVehicle && !vehicles.some((v) => v.id === currentVehicle)) {
      form.setValue('vehicleId', '')
    }
  }, [clientId, vehicles, form])

  const toggleService = (id: string) => {
    const next = serviceIds.includes(id) ? serviceIds.filter((s) => s !== id) : [...serviceIds, id]
    form.setValue('serviceIds', next)
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-ink-primary">{t('repairs:sectionClient')}</h3>
        <div>
          <Label>{t('repairs:searchClient')}</Label>
          <Input
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder={t('repairs:searchClientPlaceholder')}
          />
        </div>
        <div>
          <Label>{t('repairs:selectClient')}</Label>
          <select className={selectClass} {...form.register('clientId')}>
            <option value="">{t('repairs:selectClientPlaceholder')}</option>
            {(clientsData?.items ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.phone}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>{t('repairs:selectVehicle')}</Label>
          <select className={selectClass} disabled={!clientId} {...form.register('vehicleId')}>
            <option value="">{t('repairs:selectVehiclePlaceholder')}</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.make} {v.model} ({v.plate})
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-ink-primary">{t('repairs:sectionIntervention')}</h3>
        <div>
          <Label>{t('repairs:fieldDiagnosis')}</Label>
          <Input
            {...form.register('diagnosis')}
            placeholder={t('repairs:diagnosisPlaceholder')}
          />
          {form.formState.errors.diagnosis ? (
            <p className="mt-1 text-xs text-clay-red">{form.formState.errors.diagnosis.message}</p>
          ) : null}
        </div>
        <div>
          <Label>{t('repairs:fieldServices')}</Label>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3">
            {services.map((s) => (
              <label
                key={s.id}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm',
                  serviceIds.includes(s.id) && 'bg-clay-primary/10',
                )}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={serviceIds.includes(s.id)}
                    onChange={() => toggleService(s.id)}
                  />
                  {s.name}
                </span>
                <span className="text-xs text-ink-muted">
                  {formatCurrencyEUR(s.price ?? 0, locale)}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label>{t('repairs:fieldMechanic')}</Label>
          <select className={selectClass} {...form.register('mechanicId')}>
            <option value="">{t('repairs:noMechanic')}</option>
            {mechanics.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>{t('repairs:fieldPriority')}</Label>
          <select className={selectClass} {...form.register('priority')}>
            <option value="low">{t('repairs:priorityLow')}</option>
            <option value="normal">{t('repairs:priorityNormal')}</option>
            <option value="high">{t('repairs:priorityHigh')}</option>
            <option value="urgent">{t('repairs:priorityUrgent')}</option>
          </select>
        </div>
      </section>

      <section className="space-y-3">
        <button
          type="button"
          className="text-sm font-semibold text-clay-primary hover:underline"
          onClick={() => setPlanOpen((o) => !o)}
        >
          {planOpen ? t('repairs:hidePlanning') : t('repairs:showPlanning')}
        </button>
        {planOpen ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{t('repairs:fieldStartDate')}</Label>
              <Input type="datetime-local" {...form.register('startDate')} />
            </div>
            <div>
              <Label>{t('repairs:fieldEndDate')}</Label>
              <Input type="datetime-local" {...form.register('endDate')} />
            </div>
            <div className="sm:col-span-2">
              <Label>{t('repairs:fieldDuration')}</Label>
              <Input
                type="number"
                min={0}
                {...form.register('estimatedDuration')}
                placeholder={t('repairs:durationPlaceholder')}
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-ink-primary">{t('repairs:sectionNotes')}</h3>
        <div>
          <Label>{t('repairs:fieldNotes')}</Label>
          <Textarea rows={2} {...form.register('notes')} />
        </div>
        <div>
          <Label>{t('repairs:fieldInternalNotes')}</Label>
          <Textarea rows={2} {...form.register('internalNotes')} />
        </div>
      </section>
    </div>
  )
}

export function RepairFormSubmit({
  pending,
  label,
}: {
  pending: boolean
  label: string
}): React.ReactElement {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5',
        'bg-clay-primary text-sm font-medium text-white shadow-sm',
        'hover:opacity-90 disabled:opacity-60',
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {label}
    </button>
  )
}
