import { zodResolver } from '@hookform/resolvers/zod'
import { addDays, format } from 'date-fns'
import axios from 'axios'
import { Loader2, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useClientsList } from '@/hooks/api/useClients'
import { useCreateQuote } from '@/hooks/api/useQuotes'
import { usePartsList } from '@/hooks/api/useParts'
import { useServicesList } from '@/hooks/api/useServices'
import { useClientVehicles } from '@/hooks/api/useVehicles'
import { computeLine, computeQuoteTotals } from '@/lib/quoteUtils'
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
  clientId: z.string().min(1),
  vehicleId: z.string().optional(),
  validUntil: z.string().min(1),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1),
})

type FormValues = z.infer<typeof schema>

type QuoteCreateModalProps = {
  open: boolean
  onClose: () => void
}

const selectClass = cn(
  'flex h-10 w-full rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--bg-input)] px-3 text-sm text-ink-primary',
)

const defaultValidUntil = format(addDays(new Date(), 30), 'yyyy-MM-dd')

export function QuoteCreateModal({ open, onClose }: QuoteCreateModalProps) {
  const { t } = useTranslation(['quotes', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const navigate = useNavigate()
  const createMut = useCreateQuote()
  const [clientSearch, setClientSearch] = useState('')

  const { data: clientsData } = useClientsList(clientSearch || undefined, 1, 100)
  const { data: servicesQuery } = useServicesList()
  const servicesData = servicesQuery?.items ?? []
  const { data: partsData } = usePartsList()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: '',
      vehicleId: '',
      validUntil: defaultValidUntil,
      notes: '',
      lines: [{ type: 'service', label: '', quantity: 1, unitPrice: 0, discount: 0, tva: 19 }],
    },
  })

  const clientId = form.watch('clientId')
  const { data: vehicles = [] } = useClientVehicles(clientId || undefined, 'garage')

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
    if (!open) return
    form.reset({
      clientId: '',
      vehicleId: '',
      validUntil: defaultValidUntil,
      notes: '',
      lines: [{ type: 'service', label: '', quantity: 1, unitPrice: 0, discount: 0, tva: 19 }],
    })
    setClientSearch('')
  }, [open, form])

  useEffect(() => {
    form.setValue('vehicleId', '')
  }, [clientId, form])

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
    try {
      const created = await createMut.mutateAsync({
        clientId: values.clientId,
        vehicleId: values.vehicleId || undefined,
        validUntil: new Date(`${values.validUntil}T23:59:59.000Z`).toISOString(),
        notes: values.notes,
        status: 'draft',
        lines: values.lines.map((l) => ({
          type: l.type,
          refId: l.refId || undefined,
          label: l.label,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
          tva: l.tva,
        })),
      })
      toast.success(t('quotes:createSuccess'))
      onClose()
      navigate(`/quotes/${created.id}`)
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : t('quotes:createError')
      toast.error(msg)
    }
  })

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
          <DialogTitle>{t('quotes:createTitle')}</DialogTitle>
        </DialogHeader>

        <form className="mt-4 space-y-6" onSubmit={onSubmit}>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-ink-primary">{t('quotes:sectionClient')}</h3>
            <div>
              <Label>{t('quotes:searchClient')}</Label>
              <Input
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder={t('quotes:searchClientPlaceholder')}
              />
            </div>
            <div>
              <Label>{t('quotes:selectClient')}</Label>
              <select className={selectClass} {...form.register('clientId')}>
                <option value="">{t('quotes:selectClientPlaceholder')}</option>
                {(clientsData?.items ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.phone}
                  </option>
                ))}
              </select>
              {form.formState.errors.clientId ? (
                <p className="mt-1 text-xs text-clay-red">{form.formState.errors.clientId.message}</p>
              ) : null}
            </div>
            <div>
              <Label>{t('quotes:selectVehicle')}</Label>
              <select
                className={selectClass}
                disabled={!clientId}
                {...form.register('vehicleId')}
              >
                <option value="">{t('quotes:selectVehiclePlaceholder')}</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.plate})
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-primary">{t('quotes:lines')}</h3>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  append({ type: 'service', label: '', quantity: 1, unitPrice: 0, discount: 0, tva: 19 })
                }
              >
                <Plus className="h-4 w-4" />
                {t('quotes:addLine')}
              </Button>
            </div>
            {fields.map((field, idx) => {
              const lineInput = watchedLines[idx]
              const lineHt =
                lineInput != null
                  ? computeLine({
                      type: lineInput.type ?? 'service',
                      label: lineInput.label ?? '',
                      quantity: lineInput.quantity ?? 1,
                      unitPrice: lineInput.unitPrice ?? 0,
                      discount: lineInput.discount ?? 0,
                      tva: lineInput.tva ?? 20,
                    }).totalHT
                  : 0
              return (
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
                    <Label className="text-xs">{t('quotes:discountPct')}</Label>
                    <Input type="number" min={0} {...form.register(`lines.${idx}.discount`)} />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-xs">{t('quotes:tva')}</Label>
                    <Input type="number" min={0} {...form.register(`lines.${idx}.tva`)} />
                  </div>
                  <div className="flex items-end justify-between gap-2 md:col-span-12">
                    <p className="text-sm text-ink-secondary">
                      {t('quotes:lineTotalHT')}: {formatCurrencyEUR(lineHt, locale)}
                    </p>
                    <p className="text-sm font-medium text-ink-primary">
                      {t('quotes:lineTotal')}: {formatCurrencyEUR(totals.lines[idx]?.totalTTC ?? 0, locale)}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(idx)}
                      disabled={fields.length <= 1}
                      aria-label={t('common:delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3 text-sm">
            <h3 className="mb-2 text-sm font-semibold text-ink-primary">{t('quotes:totalsSection')}</h3>
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
          </section>

          <section className="space-y-3">
            <div>
              <Label>{t('quotes:validUntil')}</Label>
              <Input type="date" {...form.register('validUntil')} />
            </div>
            <div>
              <Label>{t('quotes:notes')}</Label>
              <Textarea rows={2} {...form.register('notes')} />
            </div>
          </section>

          <Button type="submit" className="w-full" disabled={createMut.isPending}>
            {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('quotes:createSubmit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
