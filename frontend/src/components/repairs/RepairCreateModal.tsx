import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { RepairFormFields, RepairFormSubmit } from '@/components/repairs/RepairFormFields'
import {
  repairFormSchema,
  toApiBody,
  type RepairFormValues,
} from '@/components/repairs/repairFormTypes'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import api from '@/utils/api'

type RepairCreateModalProps = {
  open: boolean
  onClose: () => void
}

const defaultValues: RepairFormValues = {
  clientId: '',
  vehicleId: '',
  diagnosis: '',
  mechanicId: '',
  serviceIds: [],
  priority: 'normal',
  startDate: '',
  endDate: '',
  estimatedDuration: undefined,
  notes: '',
  internalNotes: '',
}

export function RepairCreateModal({ open, onClose }: RepairCreateModalProps): React.ReactElement {
  const { t } = useTranslation(['repairs', 'common'])
  const qc = useQueryClient()
  const form = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) return
    form.reset(defaultValues)
  }, [open, form])

  useEffect(() => {
    if (!open) return
    const sub = form.watch((_v, { name }) => {
      if (name === 'clientId') form.setValue('vehicleId', '')
    })
    return () => sub.unsubscribe()
  }, [open, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await api.post('/repairs', toApiBody(values))
      await qc.invalidateQueries({ queryKey: ['repairs'] })
      toast.success(t('repairs:createSuccess'))
      onClose()
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : t('repairs:createError')
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
          <DialogTitle>{t('repairs:createTitle')}</DialogTitle>
        </DialogHeader>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <RepairFormFields form={form} />
          <RepairFormSubmit pending={form.formState.isSubmitting} label={t('repairs:createSubmit')} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
