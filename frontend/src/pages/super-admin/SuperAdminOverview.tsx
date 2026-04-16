import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataColumn } from '@/components/ui/DataTable'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { useSuperAdminActivity, useSuperAdminStats } from '@/hooks/api/useSuperAdmin'
import { useChartTheme } from '@/hooks/useChartTheme'

const TIER_COLORS = ['#64748b', '#2563eb', '#7c3aed', '#d97706']

export function SuperAdminOverview(): React.ReactElement {
  const { t } = useTranslation('superAdmin')
  const { data: stats, isLoading, isError, error, refetch } = useSuperAdminStats()
  const { data: activity, isLoading: actLoading, isError: actErr, error: actError, refetch: refetchAct } =
    useSuperAdminActivity()
  const { textColor, gridColor } = useChartTheme()

  const topBar = (stats?.topGaragesRevenue as { name?: string; revenue?: number }[] | undefined)?.map((x) => ({
    name: (x.name ?? '?').slice(0, 12),
    revenue: Math.round(x.revenue ?? 0),
  }))

  const signups = (stats?.signupsByMonth as { month?: string; count?: number }[] | undefined) ?? []

  const tierRows =
    (stats?.tierDistribution as { tier?: string; count?: number }[] | undefined)?.map((x) => ({
      name: String(x.tier ?? ''),
      value: x.count ?? 0,
    })) ?? []

  const activityRows = useMemo(
    () => (activity ?? []).map((r, i) => ({ ...(r as object), _rk: `a-${i}` })),
    [activity],
  )

  const activityColumns: DataColumn<{ garage?: string; action?: string; date?: string; status?: string; _rk?: string }>[] =
    [
    { id: 'g', header: 'Garage', cell: (r) => r.garage ?? '—' },
    { id: 'a', header: 'Action', cell: (r) => r.action ?? '—' },
    {
      id: 'd',
      header: 'Date',
      cell: (r) => (r.date ? new Date(r.date).toLocaleString('fr-FR') : '—'),
    },
      { id: 's', header: 'Statut', cell: (r) => r.status ?? '—' },
    ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t('stats')}</h2>
        <p className="text-sm text-[var(--text-secondary)]">Indicateurs globaux (MongoDB)</p>
      </div>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        onRetry={() => void refetch()}
        isEmpty={false}
        loading={<TableSkeleton rows={4} />}
        empty={<p className="text-sm text-ink-muted">Aucune statistique</p>}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface-solid)] p-4">
            <p className="text-xs font-medium text-[var(--text-muted)]">Garages</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)]">{String(stats?.garages ?? '—')}</p>
            <p className="text-xs text-[var(--text-secondary)]">
              Actifs {String(stats?.activeGarages ?? 0)} · Suspendus {String(stats?.suspendedGarages ?? 0)}
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface-solid)] p-4">
            <p className="text-xs font-medium text-[var(--text-muted)]">Utilisateurs</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)]">{String(stats?.users ?? '—')}</p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface-solid)] p-4">
            <p className="text-xs font-medium text-[var(--text-muted)]">CA mois (factures payées)</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)]">
              {stats?.monthlyRevenue != null ? `${stats.monthlyRevenue} €` : '—'}
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface-solid)] p-4">
            <p className="text-xs font-medium text-[var(--text-muted)]">Abonnements</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)]">
              {String(stats?.subscriptionsActive ?? 0)} actifs
            </p>
            <p className="text-xs text-[var(--text-secondary)]">Expirés : {String(stats?.subscriptionsExpired ?? 0)}</p>
          </div>
        </div>
      </QueryBoundary>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ClayCard variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">CA par garage (top 10, 6 mois)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBar ?? []}>
                <CartesianGrid strokeDasharray="4 6" stroke={gridColor} />
                <XAxis dataKey="name" stroke={textColor} tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis stroke={textColor} tick={{ fill: textColor, fontSize: 11 }} />
                <RTooltip
                  contentStyle={{
                    background: 'var(--bg-dropdown)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Bar dataKey="revenue" fill="var(--accent-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </ClayCard>

        <ClayCard variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Nouveaux garages (12 mois)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={signups}>
                <CartesianGrid strokeDasharray="4 6" stroke={gridColor} />
                <XAxis dataKey="month" stroke={textColor} tick={{ fill: textColor, fontSize: 10 }} />
                <YAxis stroke={textColor} tick={{ fill: textColor, fontSize: 11 }} />
                <RTooltip
                  contentStyle={{
                    background: 'var(--bg-dropdown)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="var(--accent-purple)" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </ClayCard>
      </div>

      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Répartition des offres</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[260px] justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <RTooltip
                contentStyle={{
                  background: 'var(--bg-dropdown)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <Pie data={tierRows} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {tierRows.map((_, i) => (
                  <Cell key={String(i)} fill={TIER_COLORS[i % TIER_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </ClayCard>

      <div>
        <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">Activité récente</h3>
        <QueryBoundary
          isLoading={actLoading}
          isError={actErr}
          error={actError as Error}
          onRetry={() => void refetchAct()}
          isEmpty={!actLoading && (activity?.length ?? 0) === 0}
          loading={<TableSkeleton rows={5} />}
          empty={<p className="text-sm text-ink-muted">Aucune activité</p>}
        >
          <DataTable
            columns={activityColumns}
            data={activityRows as { garage?: string; action?: string; date?: string; status?: string; _rk?: string }[]}
            getRowKey={(r) => r._rk ?? r.garage ?? '?'}
          />
        </QueryBoundary>
      </div>
    </div>
  )
}
