import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ApiInvoice } from '@/hooks/api/useInvoices'
import { usePayInvoice } from '@/hooks/api/useInvoices'
import { formatCurrencyEUR } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'

const schema = z.object({
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'cheque']),
  amount: z.coerce.number().min(0),
  paidAt: z.string().min(1),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const selectClass =
  'flex h-10 w-full rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--bg-input)] px-3 text-sm text-ink-primary'

type PayInvoiceModalProps = {
  invoice: ApiInvoice | null
  open: boolean
  onClose: () => void
}

export function PayInvoiceModal({ invoice, open, onClose }: PayInvoiceModalProps) {
  const { t } = useTranslation(['quotes', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const payMut = usePayInvoice()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentMethod: 'cash',
      amount: 0,
      paidAt: new Date().toISOString().slice(0, 10),
      notes: '',
    },
  })

  useEffect(() => {
    if (!invoice || !open) return
    form.reset({
      paymentMethod: 'cash',
      amount: invoice.totalTTC ?? 0,
      paidAt: new Date().toISOString().slice(0, 10),
      notes: '',
    })
  }, [invoice, open, form])

  const onSubmit = form.handleSubmit(async (values) => {
    if (!invoice) return
    try {
      await payMut.mutateAsync({ id: invoice.id, paymentMethod: values.paymentMethod })
      toast.success(t('quotes:paymentRecorded', { amount: formatCurrencyEUR(values.amount, locale) }))
      onClose()
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : t('quotes:paymentError')
      toast.error(msg)
    }
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-clay">
        <DialogHeader>
          <DialogTitle>{t('quotes:markPaidTitle')}</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <Label>{t('quotes:paymentMethod')}</Label>
            <select className={selectClass} {...form.register('paymentMethod')}>
              <option value="cash">{t('quotes:payCash')}</option>
              <option value="card">{t('quotes:payCard')}</option>
              <option value="transfer">{t('quotes:payTransfer')}</option>
              <option value="cheque">{t('quotes:payCheque')}</option>
            </select>
          </div>
          <div>
            <Label>{t('quotes:amountReceived')}</Label>
            <Input type="number" step="0.01" {...form.register('amount')} />
          </div>
          <div>
            <Label>{t('quotes:paymentDate')}</Label>
            <Input type="date" {...form.register('paidAt')} />
          </div>
          <div>
            <Label>{t('quotes:notes')}</Label>
            <Textarea rows={2} {...form.register('notes')} />
          </div>
          <Button type="submit" className="w-full" disabled={payMut.isPending}>
            {payMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('quotes:confirmPayment')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
