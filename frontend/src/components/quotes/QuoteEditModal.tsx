import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Loader2, Plus, X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ApiQuote } from '@/hooks/api/useQuotes'
import { useUpdateQuote } from '@/hooks/api/useQuotes'
import { usePartsList } from '@/hooks/api/useParts'
import { useRepairsList } from '@/hooks/api/useRepairs'
import { useServicesList } from '@/hooks/api/useServices'
import { computeQuoteTotals, refIdStr, refLabel, repairShortId, stripRepairMarker } from '@/lib/quoteUtils'
import { cn, formatCurrencyEUR } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'

const lineSchema = z.object({
  type: z.enum(['service', 'part']),
  refId: z.string().optional(),
  label: z.string().min(1),
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).max(100),
  tva: z.coerce.number().min(0).max(100),
})

const schema = z.object({
  repairId: z.string().optional(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1),
})

type FormValues = z.infer<typeof schema>

type QuoteEditModalProps = {
  quote: ApiQuote | null
  open: boolean
  onClose: () => void
}

const selectClass = cn(
  'flex h-10 w-full rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--bg-input)] px-3 text-sm text-ink-primary',
)

export function QuoteEditModal({ quote, open, onClose }: QuoteEditModalProps) {
  const { t } = useTranslation(['quotes', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const updateMut = useUpdateQuote()
  const clientId = quote ? refIdStr(quote.clientId) : ''
  const vehicleId = quote ? refIdStr(quote.vehicleId) : ''

  const { data: repairsData } = useRepairsList(
    clientId ? { vehicleId: vehicleId || undefined } : undefined,
  )
  const { data: servicesQuery } = useServicesList()
  const servicesData = servicesQuery?.items ?? []
  const { data: partsData } = usePartsList()

  const openRepairs = useMemo(() => {
    const items = repairsData?.items ?? []
    return items.filter(
      (r) =>
        ['pending', 'in_progress', 'waiting_parts'].includes(r.status) &&
        (!clientId || refIdStr(r.clientId) === clientId),
    )
  }, [repairsData, clientId])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      repairId: '',
      validUntil: '',
      notes: '',
      lines: [{ type: 'service', label: '', quantity: 1, unitPrice: 0, discount: 0, tva: 20 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' })
  const watchedLines = form.watch('lines')
  const totals = useMemo(
    () =>
      computeQuoteTotals(
        watchedLines.map((l) => ({
          type: l.type ?? 'service',
          label: l.label ?? '',
          quantity: l.quantity ?? 1,
          unitPrice: l.unitPrice ?? 0,
          discount: l.discount ?? 0,
          tva: l.tva ?? 20,
          refId: l.refId,
        })),
      ),
    [watchedLines],
  )

  useEffect(() => {
    if (!quote || !open) return
    const lines = (quote.lines ?? []).map((l) => ({
      type: l.type,
      refId: l.refId ? String(l.refId) : '',
      label: l.label,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discount ?? 0,
      tva: l.tva ?? 20,
    }))
    form.reset({
      repairId: quote.repairId ?? '',
      validUntil: quote.validUntil ? quote.validUntil.slice(0, 10) : '',
      notes: stripRepairMarker(quote.notes ?? ''),
      lines: lines.length ? lines : [{ type: 'service', label: '', quantity: 1, unitPrice: 0, discount: 0, tva: 20 }],
    })
  }, [quote, open, form])

  const applyRef = (idx: number, type: 'service' | 'part', refId: string) => {
    if (type === 'service') {
      const s = servicesData.find((x) => x.id === refId)
      if (s) {
        form.setValue(`lines.${idx}.label`, s.name)
        form.setValue(`lines.${idx}.unitPrice`, s.price ?? 0)
        form.setValue(`lines.${idx}.refId`, refId)
      }
    } else {
      const p = partsData?.items?.find((x) => x.id === refId)
      if (p) {
        form.setValue(`lines.${idx}.label`, p.name)
        form.setValue(`lines.${idx}.unitPrice`, p.price ?? 0)
        form.setValue(`lines.${idx}.refId`, refId)
      }
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!quote) return
    try {
      await updateMut.mutateAsync({
        id: quote.id,
        payload: {
          repairId: values.repairId || undefined,
          validUntil: values.validUntil ? new Date(values.validUntil).toISOString() : undefined,
          notes: values.notes,
          lines: values.lines.map((l) => ({
            type: l.type,
            refId: l.refId || undefined,
            label: l.label,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discount: l.discount,
            tva: l.tva,
          })),
        },
      })
      toast.success(t('quotes:editSuccess'))
      onClose()
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : t('quotes:editError')
      toast.error(msg)
    }
  })

  if (!quote) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          'max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)]',
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
          <DialogTitle>{t('quotes:editTitle')}</DialogTitle>
          <p className="text-sm text-ink-secondary">
            {t('quotes:clientReadonly')}: {refLabel(quote.clientId)} · {refLabel(quote.vehicleId)}
          </p>
        </DialogHeader>

        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <div>
            <Label>{t('quotes:linkedRepairSelect')}</Label>
            <select className={selectClass} {...form.register('repairId')}>
              <option value="">{t('quotes:noLinkedRepair')}</option>
              {openRepairs.map((r) => (
                <option key={r.id} value={r.id}>
                  {repairShortId(r.id)} — {refLabel(r.vehicleId)} ({t(`quotes:repairStatus.${r.status}`, { defaultValue: r.status })})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>{t('quotes:validUntil')}</Label>
            <Input type="date" {...form.register('validUntil')} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('quotes:lines')}</Label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  append({ type: 'service', label: '', quantity: 1, unitPrice: 0, discount: 0, tva: 20 })
                }
              >
                <Plus className="h-4 w-4" />
                {t('quotes:addLine')}
              </Button>
            </div>
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3 md:grid-cols-12"
              >
                <div className="md:col-span-2">
                  <Label className="text-xs">{t('quotes:lineType')}</Label>
                  <select
                    className={selectClass}
                    {...form.register(`lines.${idx}.type`)}
                    onChange={(e) => {
                      form.setValue(`lines.${idx}.type`, e.target.value as 'service' | 'part')
                      form.setValue(`lines.${idx}.refId`, '')
                    }}
                  >
                    <option value="service">{t('quotes:lineService')}</option>
                    <option value="part">{t('quotes:linePart')}</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">{t('quotes:lineRef')}</Label>
                  <select
                    className={selectClass}
                    value={form.watch(`lines.${idx}.refId`) ?? ''}
                    onChange={(e) => {
                      const type = form.watch(`lines.${idx}.type`)
                      applyRef(idx, type, e.target.value)
                    }}
                  >
                    <option value="">—</option>
                    {form.watch(`lines.${idx}.type`) === 'service'
                      ? servicesData.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))
                      : (partsData?.items ?? []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.reference} — {p.name}
                          </option>
                        ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <Label className="text-xs">{t('quotes:lineLabel')}</Label>
                  <Input {...form.register(`lines.${idx}.label`)} />
                </div>
                <div className="md:col-span-1">
                  <Label className="text-xs">{t('quotes:qty')}</Label>
                  <Input type="number" min={1} {...form.register(`lines.${idx}.quantity`)} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">{t('quotes:unit')}</Label>
                  <Input type="number" min={0} step="0.01" {...form.register(`lines.${idx}.unitPrice`)} />
                </div>
                <div className="md:col-span-1">
                  <Label className="text-xs">%</Label>
                  <Input type="number" min={0} {...form.register(`lines.${idx}.discount`)} />
                </div>
                <div className="md:col-span-1">
                  <Label className="text-xs">TVA</Label>
                  <Input type="number" min={0} {...form.register(`lines.${idx}.tva`)} />
                </div>
                <div className="flex items-end justify-between gap-2 md:col-span-12">
                  <p className="text-sm font-medium text-ink-primary">
                    {t('quotes:lineTotal')}:{' '}
                    {formatCurrencyEUR(totals.lines[idx]?.totalTTC ?? 0, locale)}
                  </p>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)} disabled={fields.length <= 1}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3 text-sm">
            <p className="flex justify-between">
              <span>{t('quotes:subtotalHT')}</span>
              <span>{formatCurrencyEUR(totals.subtotalHT, locale)}</span>
            </p>
            <p className="flex justify-between">
              <span>{t('quotes:totalTVA')}</span>
              <span>{formatCurrencyEUR(totals.totalTVA, locale)}</span>
            </p>
            <p className="flex justify-between">
              <span>{t('quotes:totalDiscount')}</span>
              <span>{formatCurrencyEUR(totals.totalDiscount, locale)}</span>
            </p>
            <p className="flex justify-between text-base font-bold">
              <span>{t('quotes:totalTTC')}</span>
              <span className="text-clay-primary">{formatCurrencyEUR(totals.totalTTC, locale)}</span>
            </p>
          </div>

          <div>
            <Label>{t('quotes:notes')}</Label>
            <Textarea rows={2} {...form.register('notes')} />
          </div>

          <Button type="submit" className="w-full" disabled={updateMut.isPending}>
            {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('common:save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
