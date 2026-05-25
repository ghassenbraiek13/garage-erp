import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { ServiceSelect } from '@/components/planning/ServiceSelect'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateDiagnosticReport,
  useDiagnosticReportsList,
  useFinalizeDiagnosticReport,
  useUpdateDiagnosticReport,
} from '@/hooks/api/useDiagnosticReports'
import type { ApiService } from '@/hooks/api/useServices'
import { useServicesList } from '@/hooks/api/useServices'
import { useAuthStore } from '@/store/auth'

function refId(x: unknown): string {
  if (x && typeof x === 'object' && 'id' in x) return String((x as { id: unknown }).id)
  if (x && typeof x === 'object' && '_id' in x) return String((x as { _id: unknown })._id)
  return String(x ?? '')
}

const reportSchema = (t: (k: string) => string) =>
  z.object({
    serviceId: z.string().min(1, t('reportErrorService')),
    title: z.string().min(3, t('reportErrorTitle')),
    findings: z.string().min(10, t('reportErrorFindings')),
    recommendations: z.string().min(5, t('reportErrorRecommendations')),
    clientSummary: z.string().min(10, t('reportErrorClientSummary')),
    internalNotes: z.string().optional(),
    visibleToClient: z.boolean(),
  })

type ReportFormValues = z.infer<ReturnType<typeof reportSchema>>

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-clay-red">{error}</p> : null}
    </div>
  )
}

export interface DiagnosticReportModalProps {
  open: boolean
  onClose: () => void
  repairId: string
  clientId: string
  vehicleId: string
  mechanicId?: string
  defaultServiceId?: string
}

export function DiagnosticReportModal({
  open,
  onClose,
  repairId,
  clientId,
  vehicleId,
  mechanicId,
  defaultServiceId,
}: DiagnosticReportModalProps) {
  const { t } = useTranslation(['repairs', 'common'])
  const user = useAuthStore((s) => s.user)

  const { data: servicesData } = useServicesList(1, 200, { category: 'diagnostic' })
  const diagnosticServices = servicesData?.items ?? []
  const { data: reportsData } = useDiagnosticReportsList({ repairId })
  const existing = reportsData?.items?.[0]

  const createMut = useCreateDiagnosticReport()
  const updateMut = useUpdateDiagnosticReport()
  const finalizeMut = useFinalizeDiagnosticReport()

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema((k) => t(`repairs:${k}`))),
    defaultValues: {
      serviceId: '',
      title: '',
      findings: '',
      recommendations: '',
      clientSummary: '',
      internalNotes: '',
      visibleToClient: true,
    },
  })

  const { register, handleSubmit, reset, setValue, watch, formState } = form
  const serviceId = watch('serviceId')
  const isReadOnly = existing?.status === 'finalized'
  const busy = createMut.isPending || updateMut.isPending || finalizeMut.isPending

  useEffect(() => {
    if (!open) return
    if (existing) {
      reset({
        serviceId: refId(existing.serviceId),
        title: existing.title,
        findings: existing.findings,
        recommendations: existing.recommendations,
        clientSummary: existing.clientSummary,
        internalNotes: existing.internalNotes ?? '',
        visibleToClient: existing.visibleToClient,
      })
      return
    }
    const svc = diagnosticServices.find((s) => s.id === defaultServiceId)
    reset({
      serviceId: defaultServiceId ?? '',
      title: svc ? t('repairs:reportTitleDefault', { service: svc.name }) : '',
      findings: '',
      recommendations: '',
      clientSummary: '',
      internalNotes: '',
      visibleToClient: true,
    })
  }, [open, existing, defaultServiceId, diagnosticServices, reset, t])

  const onSubmit = async (values: ReportFormValues) => {
    const mechanic = mechanicId ?? user?.id
    if (!mechanic) {
      toast.error(t('repairs:reportErrorMechanic'))
      return
    }
    try {
      if (existing) {
        await updateMut.mutateAsync({ id: existing.id, ...values })
        toast.success(t('repairs:reportSaved'))
      } else {
        await createMut.mutateAsync({
          repairId,
          clientId,
          vehicleId,
          mechanicId: mechanic,
          ...values,
        })
        toast.success(t('repairs:reportCreated'))
      }
      onClose()
    } catch {
      toast.error(t('repairs:reportErrorGeneric'))
    }
  }

  const onFinalize = async () => {
    if (!existing) {
      toast.error(t('repairs:reportSaveFirst'))
      return
    }
    try {
      await finalizeMut.mutateAsync(existing.id)
      toast.success(t('repairs:reportFinalized'))
      onClose()
    } catch {
      toast.error(t('repairs:reportErrorGeneric'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[min(92vh,800px)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('repairs:reportModalTitle')}</DialogTitle>
          <DialogDescription>{t('repairs:reportModalDescription')}</DialogDescription>
        </DialogHeader>

        {isReadOnly ? (
          <p className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-table-header)] px-3 py-2 text-sm text-ink-secondary">
            {t('repairs:reportStatusFinalized')} — {existing?.title}
          </p>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label={t('repairs:reportFieldService')} error={formState.errors.serviceId?.message}>
            <ServiceSelect
              id="diag-service"
              services={diagnosticServices}
              value={serviceId}
              onChange={(id) => setValue('serviceId', id, { shouldValidate: true })}
              onServicePick={(svc: ApiService | undefined) => {
                if (svc && !watch('title')) {
                  setValue('title', t('repairs:reportTitleDefault', { service: svc.name }))
                }
              }}
              placeholder={t('repairs:reportSelectService')}
            />
          </Field>

          <Field label={t('repairs:reportFieldTitle')} error={formState.errors.title?.message}>
            <Input id="diag-title" disabled={isReadOnly} {...register('title')} />
          </Field>

          <Field label={t('repairs:reportFieldFindings')} error={formState.errors.findings?.message}>
            <Textarea
              id="diag-findings"
              rows={4}
              disabled={isReadOnly}
              placeholder={t('repairs:reportFindingsPlaceholder')}
              {...register('findings')}
            />
          </Field>

          <Field label={t('repairs:reportFieldRecommendations')} error={formState.errors.recommendations?.message}>
            <Textarea
              id="diag-reco"
              rows={3}
              disabled={isReadOnly}
              placeholder={t('repairs:reportRecommendationsPlaceholder')}
              {...register('recommendations')}
            />
          </Field>

          <Field label={t('repairs:reportFieldClientSummary')} error={formState.errors.clientSummary?.message}>
            <Textarea
              id="diag-client"
              rows={3}
              disabled={isReadOnly}
              placeholder={t('repairs:reportClientSummaryPlaceholder')}
              {...register('clientSummary')}
            />
          </Field>

          <Field label={t('repairs:reportFieldInternalNotes')}>
            <Textarea
              id="diag-internal"
              rows={2}
              disabled={isReadOnly}
              placeholder={t('repairs:reportInternalPlaceholder')}
              {...register('internalNotes')}
            />
            <p className="text-xs text-ink-muted">{t('repairs:reportInternalHint')}</p>
          </Field>

          <label className="flex items-center gap-2 text-sm text-ink-primary">
            <input type="checkbox" disabled={isReadOnly} {...register('visibleToClient')} className="rounded" />
            {t('repairs:reportVisibleToClient')}
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              {isReadOnly ? t('common:close') : t('common:cancel')}
            </Button>
            {!isReadOnly ? (
              <>
                {existing ? (
                  <Button type="button" variant="secondary" disabled={busy} onClick={() => void onFinalize()}>
                    {t('repairs:reportFinalize')}
                  </Button>
                ) : null}
                <Button type="submit" disabled={busy}>
                  {t('repairs:reportSave')}
                </Button>
              </>
            ) : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
