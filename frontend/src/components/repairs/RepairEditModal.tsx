import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { RepairFormFields, RepairFormSubmit } from '@/components/repairs/RepairFormFields'
import {
  repairFormSchema,
  refEntityId,
  toApiBody,
  type ApiRepairRow,
  type RepairFormValues,
} from '@/components/repairs/repairFormTypes'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import api from '@/utils/api'

function toDatetimeLocal(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function repairToForm(repair: ApiRepairRow): RepairFormValues {
  const serviceIds = (repair.serviceIds ?? [])
    .map((s) => refEntityId(s))
    .filter(Boolean)
  return {
    clientId: refEntityId(repair.clientId),
    vehicleId: refEntityId(repair.vehicleId),
    diagnosis: repair.diagnosis ?? '',
    mechanicId: refEntityId(repair.mechanicId) || '',
    serviceIds,
    priority: (repair.priority as RepairFormValues['priority']) ?? 'normal',
    startDate: toDatetimeLocal(repair.startDate),
    endDate: toDatetimeLocal(repair.endDate),
    estimatedDuration: repair.estimatedDuration,
    notes: repair.notes ?? '',
    internalNotes: repair.internalNotes ?? '',
  }
}

type RepairEditModalProps = {
  repair: ApiRepairRow
  open: boolean
  onClose: () => void
}

export function RepairEditModal({ repair, open, onClose }: RepairEditModalProps): React.ReactElement {
  const { t } = useTranslation(['repairs', 'common'])
  const qc = useQueryClient()
  const initial = useMemo(() => repairToForm(repair), [repair])

  const form = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    defaultValues: initial,
  })

  useEffect(() => {
    if (!open) return
    form.reset(repairToForm(repair))
  }, [open, repair, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await api.put(`/repairs/${repair.id}`, toApiBody(values))
      await qc.invalidateQueries({ queryKey: ['repairs'] })
      await qc.invalidateQueries({ queryKey: ['repairs', 'detail', repair.id] })
      toast.success(t('repairs:updateSuccess'))
      onClose()
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : t('repairs:updateError')
      toast.error(msg)
    }
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          'max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)]',
          'bg-[var(--bg-surface)] p-6 shadow-clay',
          '[&>button:last-child]:hidden',
        )}
      >
        <DialogClose
          className={cn(
            'absolute end-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full',
            'text-ink-muted hover:bg-[var(--bg-sidebar)] hover:text-ink-primary',
          )}
          aria-label={t('common:close')}
        >
          <X className="h-4 w-4" />
        </DialogClose>
        <DialogHeader className="pe-10 text-start">
          <DialogTitle>{t('repairs:editTitle')}</DialogTitle>
        </DialogHeader>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <RepairFormFields form={form} />
          <RepairFormSubmit pending={form.formState.isSubmitting} label={t('repairs:editSubmit')} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
