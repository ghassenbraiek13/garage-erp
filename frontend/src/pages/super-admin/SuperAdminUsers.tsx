import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { DataTable, type DataColumn } from '@/components/ui/DataTable'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import type { ApiSuperUser } from '@/hooks/api/useSuperAdmin'
import { useSuperAdminUsers } from '@/hooks/api/useSuperAdmin'

export function SuperAdminUsers(): React.ReactElement {
  const { t } = useTranslation('superAdmin')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useSuperAdminUsers(page)
  const rows = data?.items ?? []
  const meta = data?.meta

  const columns: DataColumn<ApiSuperUser>[] = [
    { id: 'name', header: 'Nom', cell: (u) => <span className="font-medium">{u.name}</span> },
    { id: 'email', header: 'Email', cell: (u) => u.email },
    {
      id: 'role',
      header: 'Rôle',
      cell: (u) => (
        <Badge variant="primary" className="capitalize">
          {u.role}
        </Badge>
      ),
    },
    {
      id: 'garage',
      header: 'Garage',
      cell: (u) => <span className="font-mono text-xs">{u.garageId ?? '—'}</span>,
    },
    {
      id: 'active',
      header: 'Actif',
      cell: (u) => (u.isActive === false ? <Badge variant="danger">Non</Badge> : <Badge variant="success">Oui</Badge>),
    },
  ]

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t('users')}</h2>
      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        onRetry={() => void refetch()}
        isEmpty={!isLoading && rows.length === 0}
        loading={<TableSkeleton rows={5} />}
        empty={<p className="text-sm text-ink-muted">Aucun utilisateur</p>}
      >
        <DataTable columns={columns} data={rows} getRowKey={(u) => u.id} meta={meta} onPageChange={(p) => setPage(p)} />
      </QueryBoundary>
    </div>
  )
}
