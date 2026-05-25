import { ArrowRight, Calendar as CalendarIcon, Euro, FileText, TrendingUp, Users, Wrench } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MetricCard } from '@/components/shared/MetricCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle, ClayCard } from '@/components/ui/card'
import { DataTable, type DataColumn } from '@/components/ui/DataTable'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { useDashboardStats } from '@/hooks/api/useDashboard'
import { useChartTheme } from '@/hooks/useChartTheme'
import { cn, formatCurrencyEUR } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'
import { useAuthStore } from '@/store/auth'
import { MechanicDashboard } from '@/pages/dashboard/MechanicDashboard'
type RepairRow = {
  id: string
  status: string
  notes?: string
  clientId?: unknown
  vehicleId?: unknown
  mechanicId?: unknown
}

function popName(x: unknown): string {
  if (x && typeof x === 'object' && 'name' in x && typeof (x as { name: unknown }).name === 'string') {
    return (x as { name: string }).name
  }
  return '—'
}

function mapRepairStatus(s: string): 'in_progress' | 'completed' | 'pending' | 'cancelled' {
  if (s === 'in_progress' || s === 'waiting_parts') return 'in_progress'
  if (s === 'completed') return 'completed'
  if (s === 'pending') return 'pending'
  return 'cancelled'
}

export function DashboardPage(): React.ReactElement {
  const role = useAuthStore((s) => s.user?.role)
  if (role === 'mechanic') {
    return <MechanicDashboard />
  }
  return <ManagerDashboardView />
}

function ManagerDashboardView(): React.ReactElement {
  const { t } = useTranslation(['dashboard', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const { data: stats, isLoading, isError, error, refetch } = useDashboardStats()
  const { textColor, gridColor } = useChartTheme()

  const revenueData = useMemo(() => {
    const chart = stats?.revenueChart ?? []
    return chart.map((p) => ({ name: p.month, value: p.revenue }))
  }, [stats?.revenueChart])

  const maxRev = useMemo(() => Math.max(...revenueData.map((d) => d.value), 1), [revenueData])

  const repairsPreview = useMemo(() => {
    const raw = (stats?.recentRepairs ?? []) as RepairRow[]
    return raw.map((r) => ({
      ...r,
      id: String((r as { _id?: string })._id ?? r.id),
    }))
  }, [stats?.recentRepairs])

  const rdv = useMemo(() => {
    const raw = (stats?.upcomingAppointments ?? []) as { id?: string; _id?: string; start?: string; status?: string; clientId?: unknown; vehicleId?: unknown }[]
    return raw
      .filter((a) => a.start)
      .sort((a, b) => +new Date(a.start!) - +new Date(b.start!))
      .slice(0, 5)
  }, [stats?.upcomingAppointments])

  const repairColumns: DataColumn<RepairRow & { id: string }>[] = useMemo(
    () => [
      {
        id: 'client',
        header: t('client'),
        cell: (r) => <span className="font-medium">{popName(r.clientId)}</span>,
      },
      {
        id: 'vehicle',
        header: t('vehicle'),
        cell: (r) => <span>{popName(r.vehicleId)}</span>,
      },
      {
        id: 'type',
        header: t('type'),
        cell: (r) => <span>{r.notes?.slice(0, 40) ?? '—'}</span>,
      },
      {
        id: 'mechanic',
        header: t('mechanic'),
        cell: (r) => <span>{popName(r.mechanicId)}</span>,
      },
      {
        id: 'status',
        header: t('common:status'),
        cell: (r) => <StatusBadge status={mapRepairStatus(r.status)} />,
      },
      {
        id: 'actions',
        header: <span className="text-end">{t('common:actions')}</span>,
        cell: () => (
          <div className="text-end">
            <Button size="sm" variant="secondary">
              {t('common:view')}
            </Button>
          </div>
        ),
        headerClassName: 'text-end',
        cellClassName: 'text-end',
      },
    ],
    [t],
  )

  const clients = stats?.clients
  const repairs = stats?.repairs
  const revenue = stats?.revenue
  const quotes = stats?.quotes

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-fluid-h1 font-semibold tracking-tight text-ink-primary">{t('title')}</h1>
          <p className="mt-1 text-sm text-ink-secondary">{t('subtitle')}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-ink-secondary shadow-inner backdrop-blur-clay">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-green/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-clay-green" />
          </span>
          {t('common:updatedAgo', { mins: 5 })}
        </div>
      </div>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        onRetry={() => void refetch()}
        isEmpty={false}
        loading={<TableSkeleton rows={8} />}
        empty={<p className="text-sm text-ink-muted">Aucune donnée</p>}
      >
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={t('clients')}
              value={clients ? String(clients.total) : '—'}
              icon={Users}
              accent="primary"
              trend={
                clients
                  ? { positive: clients.growth >= 0, label: t('trendUp', { value: Math.abs(clients.growth) }) }
                  : undefined
              }
            />
            <MetricCard
              label={t('repairsActive')}
              value={repairs ? String(repairs.inProgress) : '—'}
              icon={Wrench}
              accent="blueSolid"
              pulse
            />
            <MetricCard
              label={t('revenueMonth')}
              value={revenue ? formatCurrencyEUR(revenue.thisMonth, locale) : '—'}
              icon={locale === 'ar' ? Euro : TrendingUp}
              accent="green"
              trend={
                revenue
                  ? { positive: revenue.growth >= 0, label: t('trendUp', { value: Math.abs(revenue.growth) }) }
                  : undefined
              }
            />
            <MetricCard
              label={t('quotesPending')}
              value={quotes ? String(quotes.pending) : '—'}
              icon={FileText}
              accent="orange"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <ClayCard variant="elevated" className="clay-surface-hover xl:col-span-3">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">{t('revenue')}</CardTitle>
                  <CardDescription>{t('revenueHint', { value: revenue?.growth ?? 0 })}</CardDescription>
                </div>
                <div className="text-end">
                  <p className="text-2xl font-semibold text-ink-primary">
                    {revenue ? formatCurrencyEUR(revenue.thisMonth, locale) : '—'}
                  </p>
                  <p className="text-xs font-semibold text-clay-green">{revenue ? `${revenue.growth >= 0 ? '+' : ''}${revenue.growth}%` : ''}</p>
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="h-[180px] md:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gfRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 6" stroke={gridColor} />
                      <XAxis dataKey="name" stroke={textColor} tick={{ fontSize: 11, fill: textColor }} />
                      <YAxis
                        stroke={textColor}
                        tick={{ fontSize: 11, fill: textColor }}
                        domain={[0, Math.ceil(maxRev * 1.1)]}
                        tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                      />
                      <RTooltip
                        contentStyle={{
                          background: 'var(--bg-dropdown)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          borderRadius: 12,
                        }}
                        content={({ active, payload, label }) =>
                          active && payload?.length ? (
                            <div className="rounded-[var(--radius-card)] px-3 py-2 text-xs shadow-clay backdrop-blur-clay">
                              <div className="font-semibold text-ink-primary">{label}</div>
                              <div className="text-ink-secondary">{formatCurrencyEUR(Number(payload[0]?.value), locale)}</div>
                            </div>
                          ) : null
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="var(--accent-primary)"
                        strokeWidth={2}
                        fill="url(#gfRev)"
                        isAnimationActive
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </ClayCard>

            <ClayCard variant="elevated" className="clay-surface-hover xl:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">{t('appointments')}</CardTitle>
                <Link to="/planning" className="inline-flex items-center gap-1 text-sm font-semibold text-clay-primary">
                  {t('seePlanning')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                  {rdv.length === 0 ? (
                    <p className="text-sm text-ink-muted">Aucun rendez-vous à venir</p>
                  ) : (
                    rdv.map((a) => (
                      <div
                        key={String(a._id ?? a.id)}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-clay-primary/12 text-clay-primary">
                            <CalendarIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-ink-primary">{popName(a.clientId)}</p>
                              <Badge variant="success">{a.status ?? '—'}</Badge>
                            </div>
                            <p className="text-xs text-ink-secondary">
                              {popName(a.vehicleId)} · {t('appointments')}
                            </p>
                          </div>
                        </div>
                        <div className="text-end text-xs font-medium text-ink-secondary">
                          <div>{format(new Date(a.start!), 'dd MMM', { locale: fr })}</div>
                          <div>{format(new Date(a.start!), 'HH:mm')}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')} to="/planning">
                  {t('seeAll')}
                </Link>
              </CardContent>
            </ClayCard>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <ClayCard variant="elevated" className="clay-surface-hover xl:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">{t('recentRepairs')}</CardTitle>
                <CardDescription>Atelier — aperçu rapide</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={repairColumns}
                  data={repairsPreview}
                  getRowKey={(r) => r.id}
                  emptyMessage="Aucune réparation récente"
                />
              </CardContent>
            </ClayCard>

            <ClayCard variant="elevated" className="clay-surface-hover xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">{t('quickActions')}</CardTitle>
                <CardDescription>Raccourcis fréquents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Link
                    className={cn(buttonVariants({ variant: 'primary' }), 'h-auto w-full justify-start gap-2 py-3')}
                    to="/clients?new=1"
                  >
                    <Users className="h-5 w-5" />
                    {t('newClient')}
                  </Link>
                  <Link
                    className={cn(buttonVariants({ variant: 'orange' }), 'h-auto w-full justify-start gap-2 py-3')}
                    to="/quotes?new=1"
                  >
                    <FileText className="h-5 w-5" />
                    {t('newQuote')}
                  </Link>
                  <Link
                    className={cn(buttonVariants({ variant: 'green' }), 'h-auto w-full justify-start gap-2 py-3')}
                    to="/planning?new=1"
                  >
                    <CalendarIcon className="h-5 w-5" />
                    {t('schedule')}
                  </Link>
                  <Link
                    className={cn(buttonVariants({ variant: 'purple' }), 'h-auto w-full justify-start gap-2 py-3')}
                    to="/stock"
                  >
                    <Euro className="h-5 w-5" />
                    {t('seeStock')}
                  </Link>
                </div>
              </CardContent>
            </ClayCard>
          </div>
        </>
      </QueryBoundary>
    </div>
  )
}
