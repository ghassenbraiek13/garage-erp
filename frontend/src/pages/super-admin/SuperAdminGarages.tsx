import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, type DataColumn } from '@/components/ui/DataTable'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import type { ApiGarage } from '@/hooks/api/useSuperAdmin'
import { useSuperAdminGarages } from '@/hooks/api/useSuperAdmin'

export function SuperAdminGarages(): React.ReactElement {
  const { t } = useTranslation('superAdmin')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useSuperAdminGarages(q.trim() || undefined, page)
  const rows = data?.items ?? []
  const meta = data?.meta

  const columns: DataColumn<ApiGarage>[] = [
    {
      id: 'name',
      header: 'Nom',
      cell: (g) => <span className="font-medium">{g.name}</span>,
    },
    {
      id: 'city',
      header: 'Ville',
      cell: (g) => g.address?.city ?? '—',
    },
    {
      id: 'tier',
      header: 'Offre',
      cell: (g) => (
        <Badge variant="primary" className="capitalize">
          {g.subscriptionTier ?? '—'}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Statut',
      cell: (g) => {
        const s = g.subscriptionStatus
        const variant = s === 'active' ? 'success' : s === 'suspended' ? 'danger' : 'default'
        return (
          <Badge variant={variant} className="capitalize">
            {s ?? '—'}
          </Badge>
        )
      },
    },
    {
      id: 'created',
      header: 'Créé le',
      cell: (g) => (g.createdAt ? new Date(g.createdAt).toLocaleDateString('fr-FR') : '—'),
    },
    {
      id: 'actions',
      header: <span className="text-end">Actions</span>,
      headerClassName: 'text-end',
      cellClassName: 'text-end',
      cell: () => (
        <Button size="sm" variant="secondary" type="button">
          Voir
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t('garages')}</h2>
        <div className="flex flex-wrap gap-2">
          <input
            className="h-10 min-w-[200px] rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            placeholder="Rechercher…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
          />
          <Button type="button">{t('createGarage')}</Button>
        </div>
      </div>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        onRetry={() => void refetch()}
        isEmpty={!isLoading && rows.length === 0}
        loading={<TableSkeleton rows={6} />}
        empty={<p className="text-sm text-ink-muted">Aucun garage</p>}
      >
        <DataTable
          columns={columns}
          data={rows}
          getRowKey={(g) => g.id}
          meta={meta}
          onPageChange={(p) => setPage(p)}
        />
      </QueryBoundary>
    </div>
  )
}
