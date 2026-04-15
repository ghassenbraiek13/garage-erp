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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn, formatCurrencyEUR } from '@/lib/utils'
import { mockAppointments } from '@/mocks/mockAppointments'
import { mockClients } from '@/mocks/mockClients'
import { mockMechanics } from '@/mocks/mockMechanics'
import { mockRepairs } from '@/mocks/mockRepairs'
import { mockRevenue } from '@/mocks/mockRevenue'
import { mockVehicles } from '@/mocks/mockVehicles'
import { useLocaleStore } from '@/store/locale'
import type { RepairStatus } from '@/types'

export function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'common'])
  const locale = useLocaleStore((s) => s.locale)

  const revenueData = useMemo(
    () =>
      mockRevenue.map((p) => ({
        name: p.month.slice(5),
        value: p.value,
      })),
    [],
  )

  const repairsPreview = mockRepairs.slice(0, 5)
  const rdv = mockAppointments
    .filter((a) => a.status === 'confirmed')
    .slice(0, 3)
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))

  const mapStatus = (s: RepairStatus): Parameters<typeof StatusBadge>[0]['status'] => {
    if (s === 'in_progress') return 'in_progress'
    if (s === 'completed') return 'completed'
    if (s === 'pending') return 'pending'
    return 'cancelled'
  }

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t('clients')}
          value="156"
          icon={Users}
          accent="primary"
          trend={{ positive: true, label: t('trendUp', { value: 8 }) }}
        />
        <MetricCard
          label={t('repairsActive')}
          value="12"
          icon={Wrench}
          accent="blueSolid"
          pulse
        />
        <MetricCard
          label={t('revenueMonth')}
          value="28 450 €"
          icon={locale === 'ar' ? Euro : TrendingUp}
          accent="green"
          trend={{ positive: true, label: t('trendUp', { value: 12 }) }}
        />
        <MetricCard label={t('quotesPending')} value="8" icon={FileText} accent="orange" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <ClayCard variant="elevated" className="clay-surface-hover xl:col-span-3">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">{t('revenue')}</CardTitle>
              <CardDescription>{t('revenueHint', { value: 12 })}</CardDescription>
            </div>
            <div className="text-end">
              <p className="text-2xl font-semibold text-ink-primary">{formatCurrencyEUR(29500, locale)}</p>
              <p className="text-xs font-semibold text-clay-green">+12%</p>
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
                  <CartesianGrid strokeDasharray="4 6" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="var(--text-muted)"
                    tick={{ fontSize: 11 }}
                    domain={[0, 30000]}
                    ticks={[7500, 15000, 22500, 30000]}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <RTooltip
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-xs shadow-clay backdrop-blur-clay">
                          <div className="font-semibold text-ink-primary">{label}</div>
                          <div className="text-ink-secondary">
                            {formatCurrencyEUR(Number(payload[0]?.value), locale)}
                          </div>
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
              {rdv.map((a) => {
                const client = mockClients.find((c) => c.id === a.clientId)
                const vehicle = mockVehicles.find((v) => v.id === a.vehicleId)
                return (
                  <div
                    key={a.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-clay-primary/12 text-clay-primary">
                        <CalendarIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-ink-primary">{client?.name}</p>
                          <Badge variant="success">{t('confirmed')}</Badge>
                        </div>
                        <p className="text-xs text-ink-secondary">
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : '—'} · Réparation
                        </p>
                      </div>
                    </div>
                    <div className="text-end text-xs font-medium text-ink-secondary">
                      <div>{format(new Date(a.start), 'dd MMM', { locale: fr })}</div>
                      <div>{format(new Date(a.start), 'HH:mm')}</div>
                    </div>
                  </div>
                )
              })}
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
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('client')}</TableHead>
                  <TableHead>{t('vehicle')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('mechanic')}</TableHead>
                  <TableHead>{t('common:status')}</TableHead>
                  <TableHead className="text-end">{t('common:actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairsPreview.map((r) => {
                  const client = mockClients.find((c) => c.id === r.clientId)
                  const vehicle = mockVehicles.find((v) => v.id === r.vehicleId)
                  const mech = mockMechanics.find((m) => m.id === r.mechanicId)
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{client?.name}</TableCell>
                      <TableCell>{vehicle ? `${vehicle.make} ${vehicle.model}` : '—'}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell>{mech?.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={mapStatus(r.status)} />
                      </TableCell>
                      <TableCell className="text-end">
                        <Button size="sm" variant="secondary">
                          {t('common:view')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
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
    </div>
  )
}
