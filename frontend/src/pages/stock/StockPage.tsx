import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { mockParts } from '@/mocks/mockParts'
import type { Part } from '@/types'
import { cn } from '@/lib/utils'

const schema = z.object({
  reference: z.string().min(2),
  name: z.string().min(2),
  category: z.string().min(2),
  price: z.coerce.number().min(0),
  quantity: z.coerce.number().min(0),
  supplier: z.string().min(2),
})

export function StockPage() {
  const { t } = useTranslation(['stock', 'common'])
  const [parts, setParts] = useState<Part[]>(mockParts)
  const [open, setOpen] = useState(false)
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  const low = useMemo(() => parts.filter((p) => p.stock < p.minStock), [parts])

  const barColor = (p: Part) => {
    if (p.stock < 10) return 'bg-clay-red'
    if (p.stock < 30) return 'bg-clay-orange'
    return 'bg-clay-green'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-fluid-h1 font-semibold">{t('title')}</h1>
          <p className="text-sm text-ink-secondary">Seuils : rouge &lt;10, orange &lt;30</p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          Ajouter une pièce
        </Button>
      </div>

      {low.length ? (
        <ClayCard variant="elevated" className="border-clay-orange/40">
          <CardHeader>
            <CardTitle className="text-base text-clay-orange">{t('lowStock')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-ink-secondary">
            {low.length} référence(s) sous le seuil minimum.
          </CardContent>
        </ClayCard>
      ) : null}

      <ClayCard variant="elevated">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reference')}</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Visibilité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.reference}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="w-[240px]">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-sidebar)]">
                        <div
                          className={cn('h-2 rounded-full', barColor(p))}
                          style={{ width: `${Math.min(100, (p.stock / 60) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold">{p.stock}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.visibility === 'public' ? 'success' : 'default'}>{p.visibility}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </ClayCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter / éditer pièce</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit((values) => {
              const np: Part = {
                id: `p-${Date.now()}`,
                reference: values.reference,
                name: values.name,
                category: values.category,
                price: values.price,
                stock: values.quantity,
                minStock: 10,
                supplier: values.supplier,
                visibility: 'public',
              }
              setParts((prev) => [np, ...prev])
              toast.success('Pièce enregistrée (démo)')
              setOpen(false)
              form.reset()
            })}
          >
            <div>
              <Label>{t('reference')}</Label>
              <Input {...form.register('reference')} />
            </div>
            <div>
              <Label>Nom</Label>
              <Input {...form.register('name')} />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Input {...form.register('category')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Prix</Label>
                <Input type="number" {...form.register('price')} />
              </div>
              <div>
                <Label>Quantité</Label>
                <Input type="number" {...form.register('quantity')} />
              </div>
            </div>
            <div>
              <Label>{t('supplier')}</Label>
              <Input {...form.register('supplier')} />
            </div>
            <Button className="w-full" type="submit">
              {t('common:save')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
