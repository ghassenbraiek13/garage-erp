import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type DataColumn } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import type { ApiPart } from '@/hooks/api/useParts'
import { usePartsList, usePartsLowStock } from '@/hooks/api/useParts'
import { cn } from '@/lib/utils'

const schema = z.object({
  reference: z.string().min(2),
  name: z.string().min(2),
  category: z.string().min(2),
  price: z.coerce.number().min(0),
  quantity: z.coerce.number().min(0),
  supplier: z.string().min(2),
})

export function StockPage(): React.ReactElement {
  const { t } = useTranslation(['stock', 'common'])
  const { data, isLoading, isError, error, refetch } = usePartsList()
  const { data: lowStockApi } = usePartsLowStock()
  const [open, setOpen] = useState(false)
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  const parts = data?.items ?? []
  const low = lowStockApi ?? parts.filter((p) => p.stock < p.minStock)

  const barColor = (p: ApiPart) => {
    if (p.stock < 10) return 'bg-clay-red'
    if (p.stock < 30) return 'bg-clay-orange'
    return 'bg-clay-green'
  }

  const columns: DataColumn<ApiPart>[] = [
    { id: 'ref', header: t('reference'), cell: (p) => <span className="font-mono text-xs">{p.reference}</span> },
    { id: 'name', header: 'Nom', cell: (p) => p.name },
    { id: 'cat', header: 'Catégorie', cell: (p) => p.category ?? '—' },
    {
      id: 'stock',
      header: 'Stock',
      cell: (p) => (
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span>{p.stock}</span>
            <span className="text-ink-muted">min {p.minStock}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-table-header)]">
            <div className={cn('h-full rounded-full transition-all', barColor(p))} style={{ width: `${Math.min(100, (p.stock / Math.max(p.minStock * 2, 1)) * 100)}%` }} />
          </div>
        </div>
      ),
    },
    { id: 'price', header: 'Prix', cell: (p) => `${p.price} €` },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-fluid-h1 font-semibold">{t('title')}</h1>
          <p className="text-sm text-ink-secondary">Données pièces détachées (API)</p>
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
        <CardContent className="p-4">
          <QueryBoundary
            isLoading={isLoading}
            isError={isError}
            error={error as Error}
            onRetry={() => void refetch()}
            isEmpty={!isLoading && parts.length === 0}
            loading={<TableSkeleton rows={6} />}
            empty={<p className="text-sm text-ink-muted">Aucune pièce</p>}
          >
            <DataTable columns={columns} data={parts} getRowKey={(p) => p.id} />
          </QueryBoundary>
        </CardContent>
      </ClayCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle pièce</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit(() => {
              toast.message('Création pièce — brancher POST /parts')
              setOpen(false)
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
              <Label>{t('category')}</Label>
              <Input {...form.register('category')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t('price')}</Label>
                <Input type="number" {...form.register('price')} />
              </div>
              <div>
                <Label>{t('stock')}</Label>
                <Input type="number" {...form.register('quantity')} />
              </div>
            </div>
            <div>
              <Label>Fournisseur</Label>
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
