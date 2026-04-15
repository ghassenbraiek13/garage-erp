import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrencyEUR } from '@/lib/utils'
import { mockInvoices, mockQuotes } from '@/mocks/mockQuotes'
import { useLocaleStore } from '@/store/locale'

const lineSchema = z.object({
  label: z.string().min(2),
  qty: z.coerce.number().min(1),
  unit: z.coerce.number().min(0),
  tva: z.coerce.number().min(0),
})

const quoteFormSchema = z.object({
  lines: z.array(lineSchema).min(1),
  discount: z.coerce.number().min(0),
})

export function QuotesPage() {
  const { t } = useTranslation(['quotes', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const [preview, setPreview] = useState(false)

  const form = useForm<z.infer<typeof quoteFormSchema>>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      discount: 0,
      lines: [{ label: 'Main d’œuvre', qty: 1, unit: 85, tva: 20 }],
    },
  })

  const watchedLines = form.watch('lines')
  const watchedDiscount = form.watch('discount')
  const totals = useMemo(() => {
    const ht = watchedLines.reduce((s, l) => s + l.qty * l.unit, 0)
    const tvaAmt = watchedLines.reduce((s, l) => s + l.qty * l.unit * (l.tva / 100), 0)
    const ttc = ht + tvaAmt - watchedDiscount
    return { ht, tvaAmt, ttc }
  }, [watchedDiscount, watchedLines])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-fluid-h1 font-semibold">{t('quotes:title')}</h1>
        <p className="text-sm text-ink-secondary">Pipeline Devis → Factures (démo)</p>
      </div>

      <Tabs defaultValue="quotes">
        <TabsList>
          <TabsTrigger value="quotes">{t('quotes:quotes')}</TabsTrigger>
          <TabsTrigger value="invoices">{t('quotes:invoices')}</TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-4">
          <ClayCard variant="elevated">
            <CardHeader>
              <CardTitle className="text-base">Liste des devis</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Total TTC</TableHead>
                    <TableHead>{t('quotes:pipeline')}</TableHead>
                    <TableHead className="text-end">{t('common:actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockQuotes.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono text-xs">{q.id}</TableCell>
                      <TableCell>{formatCurrencyEUR(q.totalTtc - q.discount, locale)}</TableCell>
                      <TableCell>
                        <Badge variant="primary">{q.status}</Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <Button size="sm" variant="secondary" type="button" onClick={() => setPreview(true)}>
                          {t('quotes:previewPdf')}
                        </Button>
                        {q.status === 'accepted' ? (
                          <Button className="ms-2" size="sm" type="button">
                            {t('quotes:convert')}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </ClayCard>

          <ClayCard variant="elevated">
            <CardHeader>
              <CardTitle className="text-base">Nouveau devis (calcul TVA)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch('lines').map((_, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <Label>{t('quotes:lines')}</Label>
                    <Input {...form.register(`lines.${idx}.label` as const)} />
                  </div>
                  <div>
                    <Label>{t('quotes:qty')}</Label>
                    <Input type="number" {...form.register(`lines.${idx}.qty` as const)} />
                  </div>
                  <div>
                    <Label>{t('quotes:unit')}</Label>
                    <Input type="number" {...form.register(`lines.${idx}.unit` as const)} />
                  </div>
                  <div>
                    <Label>{t('quotes:tva')} %</Label>
                    <Input type="number" {...form.register(`lines.${idx}.tva` as const)} />
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <Label>{t('quotes:discount')} (€)</Label>
                  <Input type="number" {...form.register('discount')} />
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3 text-sm">
                  <p>
                    HT : <span className="font-semibold">{formatCurrencyEUR(totals.ht, locale)}</span>
                  </p>
                  <p>
                    TVA : <span className="font-semibold">{formatCurrencyEUR(totals.tvaAmt, locale)}</span>
                  </p>
                  <p>
                    TTC : <span className="font-semibold">{formatCurrencyEUR(totals.ttc, locale)}</span>
                  </p>
                </div>
              </div>
              <Button type="button" onClick={() => form.handleSubmit(() => undefined)()}>
                {t('common:save')}
              </Button>
            </CardContent>
          </ClayCard>
        </TabsContent>

        <TabsContent value="invoices">
          <ClayCard variant="elevated">
            <CardHeader>
              <CardTitle className="text-base">{t('quotes:invoices')}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Total TTC</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                      <TableCell>{formatCurrencyEUR(inv.totalTtc, locale)}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>{inv.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </ClayCard>
        </TabsContent>
      </Tabs>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('quotes:previewPdf')}</DialogTitle>
          </DialogHeader>
          <div className="min-h-[320px] rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-6 text-black">
            <p className="text-lg font-bold">GarageFlow</p>
            <p className="text-sm">Aperçu PDF simulé (iframe/html démo)</p>
            <hr className="my-4" />
            <p>Total TTC : {formatCurrencyEUR(mockQuotes[0]?.totalTtc ?? 0, locale)}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
