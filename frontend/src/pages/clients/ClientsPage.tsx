import { zodResolver } from '@hookform/resolvers/zod'
import { FileSpreadsheet, FileText, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataColumn } from '@/components/ui/DataTable'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { useClientVehicles } from '@/hooks/api/useVehicles'
import type { ApiClient } from '@/hooks/api/useClients'
import { useClientsList, useCreateClient, useDeleteClient } from '@/hooks/api/useClients'
import { formatCurrencyEUR, formatNumber } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'
import api from '@/utils/api'

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^(\+33|0)[1-9](\d{8})$/),
  email: z.string().email().optional().or(z.literal('')),
  street: z.string().min(2),
  city: z.string().min(2),
  postalCode: z.string().min(4),
})

export function ClientsPage(): React.ReactElement {
  const { t } = useTranslation(['clients', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [openCreate, setOpenCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<ApiClient | null>(null)
  const [detail, setDetail] = useState<ApiClient | null>(null)

  const { data, isLoading, isError, error, refetch } = useClientsList(q.trim() || undefined, page, 50)
  const rows = data?.items ?? []
  const meta = data?.meta
  const { data: detailVehicles } = useClientVehicles(detail?.id)
  const createMut = useCreateClient()
  const deleteMut = useDeleteClient()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', street: '', city: '', postalCode: '' },
  })

  const columns: DataColumn<ApiClient>[] = [
    { id: 'name', header: t('clients:name'), cell: (c) => <span className="font-medium">{c.name}</span> },
    { id: 'phone', header: t('clients:phone'), cell: (c) => c.phone },
    {
      id: 'vehicles',
      header: t('clients:vehicles'),
      cell: (c) => String(c.vehicleIds?.length ?? 0),
    },
    {
      id: 'lastVisit',
      header: t('clients:lastVisit'),
      cell: (c) => (c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('fr-FR') : '—'),
    },
    {
      id: 'spent',
      header: t('clients:spent'),
      cell: (c) => formatCurrencyEUR(c.totalSpent ?? 0, locale),
    },
    {
      id: 'actions',
      header: <span className="text-end">{t('common:actions')}</span>,
      headerClassName: 'text-end',
      cellClassName: 'text-end',
      cell: (c) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" type="button" onClick={() => setDetail(c)}>
            {t('common:view')}
          </Button>
          <Button size="sm" variant="secondary" type="button" onClick={() => toast.message('Édition — bientôt')}>
            {t('common:edit')}
          </Button>
          <Button size="sm" variant="danger" type="button" onClick={() => setConfirmDelete(c)}>
            {t('common:delete')}
          </Button>
        </div>
      ),
    },
  ]

  async function exportPdf() {
    try {
      const res = await api.get('/clients/export/pdf', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data as Blob)
      window.open(url, '_blank', 'noopener')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      toast.success('Export PDF')
    } catch {
      toast.error('Export PDF indisponible')
    }
  }

  async function exportXlsx() {
    try {
      const res = await api.get('/clients/export/excel', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'clients.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export Excel')
    } catch {
      toast.error('Export Excel indisponible')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-fluid-h1 font-semibold">{t('clients:title')}</h1>
          <p className="text-sm text-ink-secondary">CRM atelier — données en direct</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void exportPdf()}>
            <FileText className="h-4 w-4" />
            {t('clients:exportPdf')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => void exportXlsx()}>
            <FileSpreadsheet className="h-4 w-4" />
            {t('clients:exportXlsx')}
          </Button>
          <Button type="button" onClick={() => setOpenCreate(true)}>
            <Plus className="h-4 w-4" />
            {t('clients:new')}
          </Button>
        </div>
      </div>

      <ClayCard variant="elevated">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{t('clients:title')}</CardTitle>
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              className="ps-10"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder={t('common:search')}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <QueryBoundary
            isLoading={isLoading}
            isError={isError}
            error={error as Error}
            onRetry={() => void refetch()}
            isEmpty={!isLoading && rows.length === 0}
            loading={<TableSkeleton rows={8} />}
            empty={
              <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Aucun client trouvé
              </p>
            }
          >
            <>
              <div className="md:hidden space-y-3">
                {rows.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-sidebar)] p-4 text-start shadow-clay"
                    onClick={() => setDetail(c)}
                  >
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-ink-secondary">{c.phone}</p>
                    <p className="mt-2 text-sm">
                      {t('clients:spent')}: {formatCurrencyEUR(c.totalSpent ?? 0, locale)}
                    </p>
                  </button>
                ))}
              </div>

              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={rows}
                  getRowKey={(c) => c.id}
                  meta={meta}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            </>
          </QueryBoundary>
        </CardContent>
      </ClayCard>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('clients:new')}</DialogTitle>
            <DialogDescription>Création envoyée à l&apos;API</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await createMut.mutateAsync({
                  name: values.name,
                  phone: values.phone,
                  email: values.email || undefined,
                  address: { street: values.street, city: values.city, postalCode: values.postalCode },
                })
                toast.success('Client créé')
                setOpenCreate(false)
                form.reset()
              } catch {
                toast.error('Création impossible')
              }
            })}
          >
            <div>
              <Label>{t('clients:name')}</Label>
              <Input {...form.register('name')} />
            </div>
            <div>
              <Label>{t('clients:phone')}</Label>
              <Input {...form.register('phone')} placeholder="0612345678" />
            </div>
            <div>
              <Label>Email</Label>
              <Input {...form.register('email')} />
            </div>
            <div>
              <Label>Rue</Label>
              <Input {...form.register('street')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Ville</Label>
                <Input {...form.register('city')} />
              </div>
              <div>
                <Label>Code postal</Label>
                <Input {...form.register('postalCode')} />
              </div>
            </div>
            <Button className="w-full" type="submit" disabled={createMut.isPending}>
              {t('common:save')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmDelete)} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common:confirm')}</DialogTitle>
            <DialogDescription>{t('clients:deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setConfirmDelete(null)}>
              {t('common:cancel')}
            </Button>
            <Button
              variant="danger"
              type="button"
              disabled={deleteMut.isPending}
              onClick={async () => {
                if (!confirmDelete) return
                try {
                  await deleteMut.mutateAsync(confirmDelete.id)
                  toast.success('Client supprimé')
                  setConfirmDelete(null)
                  if (detail?.id === confirmDelete.id) setDetail(null)
                } catch {
                  toast.error('Suppression impossible')
                }
              }}
            >
              {t('common:delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {detail ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-[var(--overlay)] backdrop-blur-[4px]"
            aria-label="Fermer"
            onClick={() => setDetail(null)}
          />
          <aside className="fixed inset-y-0 end-0 z-[70] w-full max-w-lg animate-in slide-in-from-right border-s border-[var(--border)] bg-[var(--bg-modal)] shadow-clay backdrop-blur-clay duration-300">
            <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t('clients:detailTitle')}</p>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">{detail.name}</h2>
                </div>
                <Button variant="secondary" type="button" onClick={() => setDetail(null)}>
                  {t('common:close')}
                </Button>
              </div>
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <p>
                  <span className="text-ink-secondary">{t('clients:phone')}:</span> {detail.phone}
                </p>
                <p>
                  <span className="text-ink-secondary">Email:</span> {detail.email ?? '—'}
                </p>
                <p>
                  <span className="text-ink-secondary">Adresse:</span>{' '}
                  {detail.address
                    ? [detail.address.street, detail.address.postalCode, detail.address.city].filter(Boolean).join(', ')
                    : '—'}
                </p>
                <p>
                  <span className="text-ink-secondary">Points fidélité:</span>{' '}
                  {formatNumber(detail.loyaltyPoints ?? 0, locale)}
                </p>
              </div>
              <div>
                <p className="mb-2 font-semibold text-[var(--text-primary)]">{t('clients:history')}</p>
                <div className="space-y-2">
                  {(detailVehicles ?? []).map((v) => (
                    <div
                      key={v.id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3 text-sm text-[var(--text-primary)]"
                    >
                      {v.make} {v.model} ({v.plate})
                    </div>
                  ))}
                  {detailVehicles?.length === 0 ? <p className="text-sm text-ink-muted">Aucun véhicule</p> : null}
                </div>
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  )
}
