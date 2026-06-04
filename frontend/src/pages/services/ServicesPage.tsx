import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ServiceFormModal } from '@/components/services/ServiceFormModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataColumn } from '@/components/ui/DataTable'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import {
  useDeleteService,
  useServicesCatalog,
  useUpdateService,
  type ApiService,
  type ServiceCategory,
} from '@/hooks/api/useServices'
import { cn } from '@/lib/utils'
import { formatTND } from '@/utils/currency'

function formatDuration(minutes: number, t: (k: string) => string): string {
  if (minutes < 60) return t('services:durationMin').replace('{{n}}', String(minutes))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return t('services:durationHour').replace('{{n}}', String(h))
  return t('services:durationHourMin').replace('{{h}}', String(h)).replace('{{m}}', String(m))
}

function categoryBadgeClass(cat?: ServiceCategory): string {
  const map: Record<ServiceCategory, string> = {
    lavage: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    vidange: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    freinage: 'bg-red-500/15 text-red-700 dark:text-red-300',
    diagnostic: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    pneumatique: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
    carrosserie: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
    electricite: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300',
    climatisation: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300',
    autre: 'bg-[var(--bg-sidebar)] text-ink-secondary',
  }
  return map[cat ?? 'autre']
}

export function ServicesPage(): React.ReactElement {
  const { t } = useTranslation(['services', 'common'])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ApiService | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ApiService | null>(null)

  const { data, isLoading, isError, error, refetch } = useServicesCatalog(1, 200, {
    search: search.trim() || undefined,
    category: category || undefined,
    isActive: activeFilter,
  })
  const updateMut = useUpdateService()
  const deleteMut = useDeleteService()

  const rows = useMemo(() => data?.items ?? [], [data?.items])

  const columns: DataColumn<ApiService>[] = [
    { id: 'name', header: t('services:name'), cell: (s) => <span className="font-medium">{s.name}</span> },
    {
      id: 'category',
      header: t('services:category'),
      cell: (s) => (
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', categoryBadgeClass(s.category))}>
          {t(`services:categories.${s.category ?? 'autre'}`)}
        </span>
      ),
    },
    {
      id: 'price',
      header: t('services:price'),
      cell: (s) => formatTND(s.price ?? 0),
    },
    {
      id: 'duration',
      header: t('services:duration'),
      cell: (s) => formatDuration(s.duration ?? 0, t),
    },
    {
      id: 'status',
      header: t('services:status'),
      cell: (s) => (
        <Badge variant={s.isActive !== false ? 'primary' : 'secondary'}>
          {s.isActive !== false ? t('services:active') : t('services:inactive')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: <span className="text-end">{t('common:actions')}</span>,
      headerClassName: 'text-end',
      cellClassName: 'text-end',
      cell: (s) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            type="button"
            onClick={() => {
              setEditing(s)
              setFormOpen(true)
            }}
          >
            {t('common:edit')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            type="button"
            disabled={updateMut.isPending}
            onClick={async () => {
              try {
                await updateMut.mutateAsync({
                  id: s.id,
                  body: { isActive: s.isActive === false },
                })
                toast.success(
                  s.isActive === false ? t('services:activated') : t('services:deactivated'),
                )
              } catch {
                toast.error(t('services:saveError'))
              }
            }}
          >
            {s.isActive === false ? t('services:activate') : t('services:deactivate')}
          </Button>
          <Button size="sm" variant="danger" type="button" onClick={() => setConfirmDelete(s)}>
            {t('common:delete')}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-fluid-h1 font-semibold">{t('services:title')}</h1>
          <p className="text-sm text-ink-secondary">{t('services:subtitle')}</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          {t('services:addButton')}
        </Button>
      </div>

      <ClayCard variant="elevated">
        <CardHeader className="gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <CardTitle className="text-base">{t('services:filters')}</CardTitle>
          <div className="flex flex-1 flex-wrap gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <Input
                className="ps-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('common:search')}
              />
            </div>
            <div>
              <Label className="sr-only">{t('services:category')}</Label>
              <select
                className={cn(
                  'h-11 rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 text-sm',
                )}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">{t('services:allCategories')}</option>
                {(
                  [
                    'lavage',
                    'vidange',
                    'freinage',
                    'diagnostic',
                    'pneumatique',
                    'carrosserie',
                    'electricite',
                    'climatisation',
                    'autre',
                  ] as const
                ).map((c) => (
                  <option key={c} value={c}>
                    {t(`services:categories.${c}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                className={cn(
                  'h-11 rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 text-sm',
                )}
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as 'all' | 'true' | 'false')}
              >
                <option value="all">{t('services:filterAll')}</option>
                <option value="true">{t('services:active')}</option>
                <option value="false">{t('services:inactive')}</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <QueryBoundary
            isLoading={isLoading}
            isError={isError}
            error={error as Error}
            onRetry={() => void refetch()}
            isEmpty={!isLoading && rows.length === 0}
            loading={<TableSkeleton rows={8} />}
            empty={<p className="py-8 text-center text-sm text-ink-muted">{t('services:empty')}</p>}
          >
            <DataTable columns={columns} data={rows} getRowKey={(s) => s.id} />
          </QueryBoundary>
        </CardContent>
      </ClayCard>

      <ServiceFormModal
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o)
          if (!o) setEditing(null)
        }}
        service={editing}
      />

      <Dialog open={Boolean(confirmDelete)} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common:confirm')}</DialogTitle>
            <DialogDescription>{t('services:deleteConfirm')}</DialogDescription>
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
                  toast.success(t('services:deleteSuccess'))
                  setConfirmDelete(null)
                } catch {
                  toast.error(t('services:saveError'))
                }
              }}
            >
              {t('common:delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
