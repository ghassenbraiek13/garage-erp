import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { getDiagnosticTypeFromNotes } from '@/components/planning/rdvPrestations'
import { DiagnosticReportPrintable } from '@/components/repairs/DiagnosticReportPrintable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateRepair } from '@/hooks/api/useRepairs'
import {
  CHECKLIST_ITEM_KEYS,
  type ChecklistStatus,
  type DiagnosticReportData,
  parseDiagnosticReport,
} from '@/lib/diagnosticReport'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

const checklistStatusSchema = z.enum(['good', 'watch', 'replace'])

function buildSchema(isPrePurchase: boolean, t: (k: string) => string) {
  return z
    .object({
      mileage: z.coerce.number().int().min(0, t('errorMileage')),
      observations: z.string().min(10, t('errorObservations')),
      recommendedWork: z.string().min(3, t('errorRecommended')),
      urgency: z.enum(['immediate', '1_month', '3_months', 'not_urgent']),
      checklist: z.record(z.string(), checklistStatusSchema),
      purchaseConclusion: z.enum(['recommended', 'reserves', 'not_recommended']).optional(),
      purchaseJustification: z.string().optional(),
      estimatedWorkBeforeUse: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (!isPrePurchase) return
      if (!data.purchaseJustification || data.purchaseJustification.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('errorPurchaseJustification'),
          path: ['purchaseJustification'],
        })
      }
    })
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>

function ChecklistRadiosInner({
  name,
  value,
  onChange,
  t,
  opts,
}: {
  name: string
  value: ChecklistStatus
  onChange: (v: ChecklistStatus) => void
  t: (k: string) => string
  opts: ChecklistStatus[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map((opt) => (
        <label
          key={opt}
          className={cn(
            'flex cursor-pointer items-center gap-1 rounded-full border px-2 py-1 text-xs',
            value === opt && opt === 'good' && 'border-clay-green bg-clay-green/10',
            value === opt && opt === 'watch' && 'border-clay-orange bg-clay-orange/10',
            value === opt && opt === 'replace' && 'border-clay-red bg-clay-red/10',
            value !== opt && 'border-[var(--border-strong)]',
          )}
        >
          <input type="radio" name={name} checked={value === opt} onChange={() => onChange(opt)} className="sr-only" />
          {t(`status.${opt}`)}
        </label>
      ))}
    </div>
  )
}

export interface DiagnosticReportFormProps {
  repairId: string
  notes?: string | null
  diagnosis?: string | null
  vehicleLabel?: string
  clientLabel?: string
}

export function DiagnosticReportForm({
  repairId,
  notes,
  diagnosis,
  vehicleLabel,
  clientLabel,
}: DiagnosticReportFormProps) {
  const { t } = useTranslation('diagnostic')
  const user = useAuthStore((s) => s.user)
  const reportType = getDiagnosticTypeFromNotes(notes) ?? 'general'
  const isPrePurchase = reportType === 'pre_purchase'
  const existing = parseDiagnosticReport(diagnosis)
  const updateMut = useUpdateRepair()
  const [savedReport, setSavedReport] = useState<DiagnosticReportData | null>(existing)

  const defaultChecklist = Object.fromEntries(
    CHECKLIST_ITEM_KEYS.map((k) => [k, 'good' as ChecklistStatus]),
  ) as Record<string, ChecklistStatus>

  const form = useForm<FormValues>({
    resolver: zodResolver(buildSchema(isPrePurchase, (k) => t(k))),
    defaultValues: {
      mileage: existing?.mileage ?? 0,
      observations: existing?.observations ?? '',
      recommendedWork: existing?.recommendedWork ?? '',
      urgency: existing?.urgency ?? 'not_urgent',
      checklist: existing?.checklist ?? defaultChecklist,
      ...(isPrePurchase
        ? {
            purchaseConclusion: existing?.purchaseConclusion ?? 'reserves',
            purchaseJustification: existing?.purchaseJustification ?? '',
            estimatedWorkBeforeUse: existing?.estimatedWorkBeforeUse ?? '',
          }
        : {}),
    },
  })

  const { register, handleSubmit, watch, setValue, formState } = form

  useEffect(() => {
    if (existing) setSavedReport(existing)
  }, [existing])

  const onSubmit = async (values: FormValues) => {
    const payload: DiagnosticReportData = {
      version: 1,
      type: isPrePurchase ? 'pre_purchase' : 'general',
      inspectionDate: format(new Date(), 'yyyy-MM-dd'),
      mileage: values.mileage,
      mechanicId: user?.id ?? '',
      mechanicName: user?.name ?? '',
      checklist: values.checklist as Record<string, ChecklistStatus>,
      observations: values.observations,
      recommendedWork: values.recommendedWork,
      urgency: values.urgency,
    }
    if (isPrePurchase && 'purchaseConclusion' in values) {
      payload.purchaseConclusion = values.purchaseConclusion
      payload.purchaseJustification = values.purchaseJustification
      payload.estimatedWorkBeforeUse = values.estimatedWorkBeforeUse
    }
    try {
      await updateMut.mutateAsync({
        id: repairId,
        body: { diagnosis: JSON.stringify(payload), notes: notes ?? undefined },
      })
      setSavedReport(payload)
      toast.success(t('saveSuccess'))
    } catch {
      toast.error(t('saveError'))
    }
  }

  const handlePrint = () => {
    if (!savedReport) {
      toast.error(t('saveBeforePrint'))
      return
    }
    window.print()
  }

  const inspectionDate = format(new Date(), 'PPP', { locale: fr })
  const purchaseJustificationError = (
    formState.errors as { purchaseJustification?: { message?: string } }
  ).purchaseJustification?.message

  return (
    <>
      {savedReport ? (
        <DiagnosticReportPrintable
          report={savedReport}
          vehicleLabel={vehicleLabel}
          clientLabel={clientLabel}
          reportType={reportType}
        />
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-ink-primary">{t('sectionGeneral')}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('inspectionDate')}</Label>
              <Input value={inspectionDate} readOnly disabled className="bg-[var(--bg-table-header)]" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="diag-mileage">{t('mileage')}</Label>
              <Input id="diag-mileage" type="number" min={0} {...register('mileage', { valueAsNumber: true })} />
              {formState.errors.mileage ? (
                <p className="text-xs text-clay-red">{formState.errors.mileage.message}</p>
              ) : null}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>{t('mechanic')}</Label>
              <Input value={user?.name ?? ''} readOnly disabled className="bg-[var(--bg-table-header)]" />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-ink-primary">{t('sectionChecklist')}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {CHECKLIST_ITEM_KEYS.map((key) => (
              <div
                key={key}
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-table-header)] p-3"
              >
                <p className="mb-2 text-sm font-medium text-ink-primary">{t(`checklist.${key}`)}</p>
                <ChecklistRadiosInner
                  name={key}
                  value={(watch(`checklist.${key}`) as ChecklistStatus) ?? 'good'}
                  onChange={(v) => setValue(`checklist.${key}`, v, { shouldValidate: true })}
                  t={t}
                  opts={['good', 'watch', 'replace']}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-ink-primary">{t('sectionObservations')}</h3>
          <div className="space-y-2">
            <Label htmlFor="diag-obs">{t('observations')}</Label>
            <Textarea id="diag-obs" rows={4} {...register('observations')} />
            {formState.errors.observations ? (
              <p className="text-xs text-clay-red">{formState.errors.observations.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>{t('recommendedWork')}</Label>
            <Textarea rows={3} {...register('recommendedWork')} />
            {formState.errors.recommendedWork ? (
              <p className="text-xs text-clay-red">{formState.errors.recommendedWork.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>{t('urgencyLabel')}</Label>
            <select
              className="flex h-11 w-full rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 text-sm"
              {...register('urgency')}
            >
              <option value="immediate">{t('urgency.immediate')}</option>
              <option value="1_month">{t('urgency.1_month')}</option>
              <option value="3_months">{t('urgency.3_months')}</option>
              <option value="not_urgent">{t('urgency.not_urgent')}</option>
            </select>
          </div>
        </section>

        {isPrePurchase ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-ink-primary">{t('sectionPurchase')}</h3>
            <div className="space-y-2">
              <Label>{t('purchaseConclusion')}</Label>
              <div className="flex flex-col gap-2">
                {(['recommended', 'reserves', 'not_recommended'] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2 text-sm">
                    <input type="radio" value={v} {...register('purchaseConclusion')} />
                    {t(`purchase.${v}`)}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('purchaseJustification')}</Label>
              <Textarea rows={3} {...register('purchaseJustification')} />
              {purchaseJustificationError ? (
                <p className="text-xs text-clay-red">{purchaseJustificationError}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>{t('estimatedWork')}</Label>
              <Textarea rows={2} {...register('estimatedWorkBeforeUse')} />
            </div>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={updateMut.isPending}>
            {t('saveReport')}
          </Button>
          {savedReport ? (
            <Button type="button" variant="secondary" onClick={handlePrint}>
              {t('generatePdf')}
            </Button>
          ) : null}
        </div>
      </form>
    </>
  )
}
