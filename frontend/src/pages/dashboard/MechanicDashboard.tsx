import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  Wrench,
} from 'lucide-react'
import {
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PageLoader } from '@/components/shared/PageLoader'
import { clientPop, vehiclePop } from '@/components/repairs/repairFormTypes'
import type { ApiRepair } from '@/hooks/api/useRepairs'
import { useRepairsList } from '@/hooks/api/useRepairs'
import { useAppointmentsList } from '@/hooks/api/useAppointments'
import { useMyTasks, usePatchTaskStatus, type ApiTask } from '@/hooks/api/useTasks'
import { refLabel } from '@/lib/quoteUtils'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useLocaleStore } from '@/store/locale'

function refId(x: unknown): string {
  if (x && typeof x === 'object' && 'id' in x) return String((x as { id: unknown }).id)
  if (x && typeof x === 'object' && '_id' in x) return String((x as { _id: unknown })._id)
  return String(x ?? '')
}

function priorityVariant(p?: string): 'default' | 'primary' | 'warning' | 'danger' {
  if (p === 'urgent' || p === 'high') return 'danger'
  if (p === 'normal') return 'primary'
  return 'default'
}

type KpiCardProps = {
  title: string
  value: string | number
  hint?: string
  icon: React.ReactNode
  accentClass: string
}

function KpiCard({ title, value, hint, icon, accentClass }: KpiCardProps) {
  return (
    <ClayCard variant="elevated" className="overflow-hidden">
      <CardContent className="flex items-start gap-4 p-5">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
            accentClass,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-ink-muted">{title}</p>
          <p className="text-2xl font-bold text-ink-primary">{value}</p>
          {hint ? <p className="mt-1 text-xs text-ink-secondary line-clamp-2">{hint}</p> : null}
        </div>
      </CardContent>
    </ClayCard>
  )
}

export function MechanicDashboard(): React.ReactElement {
  const { t } = useTranslation(['mechanicDashboard', 'tasks', 'repairs', 'common'])
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''
  const locale = useLocaleStore((s) => s.locale)
  const dateLocale = locale === 'ar' ? undefined : fr

  const { data: myTasks = [], isLoading: tasksLoading } = useMyTasks()
  const { data: repairsData, isLoading: repairsLoading } = useRepairsList({
    mechanicId: userId || undefined,
  })
  const apptRange = useMemo(() => {
    const start = new Date()
    start.setDate(start.getDate() - 1)
    const end = new Date()
    end.setDate(end.getDate() + 60)
    return { start: start.toISOString(), end: end.toISOString() }
  }, [])
  const { data: apptData } = useAppointmentsList(apptRange, { mechanicId: userId || undefined })
  const patchTask = usePatchTaskStatus()

  const repairs = repairsData?.items ?? []

  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

  const tasksToday = useMemo(
    () =>
      myTasks.filter((task) => {
        if (task.status === 'done') return false
        if (!task.dueDate) return false
        return isSameDay(parseISO(task.dueDate), today)
      }),
    [myTasks, today],
  )

  const repairsInProgress = useMemo(
    () => repairs.filter((r) => r.status === 'in_progress'),
    [repairs],
  )

  const tasksDoneThisWeek = useMemo(
    () =>
      myTasks.filter((task) => {
        if (task.status !== 'done') return false
        const updated = (task as ApiTask & { updatedAt?: string }).updatedAt
        if (!updated) return true
        try {
          return isWithinInterval(parseISO(updated), { start: weekStart, end: weekEnd })
        } catch {
          return true
        }
      }),
    [myTasks, weekStart, weekEnd],
  )

  const nextAppointment = useMemo(() => {
    const now = Date.now()
    return (apptData?.items ?? [])
      .filter((a) => new Date(a.start).getTime() >= now)
      .sort((a, b) => +new Date(a.start) - +new Date(b.start))[0]
  }, [apptData])

  const activeTasks = useMemo(
    () => myTasks.filter((t) => t.status === 'todo' || t.status === 'in_progress').slice(0, 8),
    [myTasks],
  )

  const activeRepairs = useMemo(
    () =>
      repairs
        .filter((r) => r.status === 'pending' || r.status === 'in_progress' || r.status === 'waiting_parts')
        .slice(0, 8),
    [repairs],
  )

  const moveTask = (id: string, status: string) => {
    patchTask.mutate(
      { id, status },
      {
        onError: () => toast.error(t('tasks:updateError')),
      },
    )
  }

  const isLoading = tasksLoading || repairsLoading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-fluid-h1 font-semibold text-ink-primary">{t('mechanicDashboard:title')}</h1>
        <p className="mt-1 text-sm text-ink-secondary">{t('mechanicDashboard:subtitle')}</p>
      </div>

      <QueryBoundary
        isLoading={isLoading}
        isError={false}
        error={null}
        onRetry={() => undefined}
        isEmpty={false}
        loading={<PageLoader />}
        empty={null}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title={t('mechanicDashboard:kpiTasksToday')}
            value={tasksToday.length}
            icon={<CheckSquare className="h-6 w-6 text-clay-primary" />}
            accentClass="bg-clay-primary/15"
          />
          <KpiCard
            title={t('mechanicDashboard:kpiRepairsProgress')}
            value={repairsInProgress.length}
            icon={<Wrench className="h-6 w-6 text-clay-orange" />}
            accentClass="bg-clay-orange/15"
          />
          <KpiCard
            title={t('mechanicDashboard:kpiDoneWeek')}
            value={tasksDoneThisWeek.length}
            icon={<CheckCircle2 className="h-6 w-6 text-clay-green" />}
            accentClass="bg-clay-green/15"
          />
          <KpiCard
            title={t('mechanicDashboard:kpiNextRdv')}
            value={
              nextAppointment
                ? format(new Date(nextAppointment.start), 'HH:mm', { locale: dateLocale })
                : '—'
            }
            hint={
              nextAppointment
                ? refLabel(nextAppointment.clientId, t('mechanicDashboard:unknownClient'))
                : t('mechanicDashboard:noRdv')
            }
            icon={<Calendar className="h-6 w-6 text-clay-purple" />}
            accentClass="bg-clay-purple/15"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ClayCard variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('mechanicDashboard:myTasksTitle')}</CardTitle>
              <Button variant="secondary" size="sm" asChild>
                <Link to="/tasks">{t('mechanicDashboard:viewKanban')}</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeTasks.length === 0 ? (
                <p className="text-sm text-ink-muted">{t('mechanicDashboard:noTasks')}</p>
              ) : (
                activeTasks.map((task) => {
                  const repair =
                    task.repairId && typeof task.repairId === 'object' ? task.repairId : null
                  const vehicle = repair?.vehicleId ? refLabel(repair.vehicleId) : '—'
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-ink-primary">{task.title}</p>
                        <Badge variant={priorityVariant(task.priority)}>{task.priority ?? '—'}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink-secondary">{vehicle}</p>
                      {task.dueDate ? (
                        <p className="mt-1 text-xs text-ink-muted">
                          {format(parseISO(task.dueDate), 'd MMM yyyy', { locale: dateLocale })}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {task.status === 'todo' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            type="button"
                            onClick={() => moveTask(task.id, 'in_progress')}
                          >
                            {t('mechanicDashboard:markInProgress')}
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => moveTask(task.id, 'done')}
                        >
                          {t('mechanicDashboard:markDone')}
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </ClayCard>

          <ClayCard variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('mechanicDashboard:myRepairsTitle')}</CardTitle>
              <Button variant="secondary" size="sm" asChild>
                <Link to="/repairs">{t('mechanicDashboard:viewAllRepairs')}</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeRepairs.length === 0 ? (
                <p className="text-sm text-ink-muted">{t('mechanicDashboard:noRepairs')}</p>
              ) : (
                activeRepairs.map((r) => {
                  const row = r as ApiRepair
                  const client = clientPop(row.clientId)
                  const vehicle = vehiclePop(row.vehicleId)
                  return (
                    <div
                      key={row.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-primary">{client?.name ?? '—'}</p>
                        <p className="text-xs text-ink-secondary">
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : '—'}
                          {vehicle?.plate ? ` · ${vehicle.plate}` : ''}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                          {row.diagnosis ?? row.notes ?? '—'}
                        </p>
                        <Badge variant="primary" className="mt-2">
                          {row.status}
                        </Badge>
                      </div>
                      <Button size="sm" variant="secondary" asChild>
                        <Link to={`/repairs/${row.id}`}>{t('repairs:viewDetail')}</Link>
                      </Button>
                    </div>
                  )
                })
              )}
            </CardContent>
          </ClayCard>
        </div>
      </QueryBoundary>
    </div>
  )
}
