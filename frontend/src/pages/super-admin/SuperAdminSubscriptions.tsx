import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { DataTable, type DataColumn } from '@/components/ui/DataTable'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import type { ApiSubscriptionRow } from '@/hooks/api/useSuperAdmin'
import { useSuperAdminSubscriptions } from '@/hooks/api/useSuperAdmin'

export function SuperAdminSubscriptions(): React.ReactElement {
  const { t } = useTranslation('superAdmin')
  const { data, isLoading, isError, error, refetch } = useSuperAdminSubscriptions()
  const rows = data ?? []

  const columns: DataColumn<ApiSubscriptionRow>[] = [
    { id: 'name', header: 'Garage', cell: (r) => <span className="font-medium">{r.name}</span> },
    {
      id: 'tier',
      header: 'Offre',
      cell: (r) => (
        <Badge variant="primary" className="capitalize">
          {r.subscriptionTier ?? '—'}
        </Badge>
      ),
    },
    {
      id: 'exp',
      header: 'Expiration',
      cell: (r) => (r.subscriptionExpiresAt ? new Date(r.subscriptionExpiresAt).toLocaleDateString('fr-FR') : '—'),
    },
    {
      id: 'st',
      header: 'Statut',
      cell: (r) => (
        <Badge variant={r.subscriptionStatus === 'active' ? 'success' : 'warning'} className="capitalize">
          {r.subscriptionStatus ?? '—'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t('subscriptions')}</h2>
      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        onRetry={() => void refetch()}
        isEmpty={!isLoading && rows.length === 0}
        loading={<TableSkeleton rows={5} />}
        empty={<p className="text-sm text-ink-muted">Aucune donnée</p>}
      >
        <DataTable columns={columns} data={rows} getRowKey={(r) => r.id} />
      </QueryBoundary>
    </div>
  )
}
