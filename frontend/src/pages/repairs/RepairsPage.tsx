import { useQueryClient } from '@tanstack/react-query'
import { format, getDay, parse, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarDays, List, Pencil, Plus, Search, Trash2, User } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { RepairCreateModal } from '@/components/repairs/RepairCreateModal'
import { RepairEditModal } from '@/components/repairs/RepairEditModal'
import {
  type ApiRepairRow,
  clientPop,
  mechanicPop,
  refEntityId,
  vehiclePop,
} from '@/components/repairs/repairFormTypes'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataColumn } from '@/components/ui/DataTable'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { Button } from '@/components/ui/button'
import { useRepairsList } from '@/hooks/api/useRepairs'
import { useMechanics } from '@/hooks/api/useUsers'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import api from '@/utils/api'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import '@/styles/calendar.css'

const DnDCalendar = withDragAndDrop(Calendar)

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { fr },
})

const MECHANIC_COLORS = [
  '#2563EB',
  '#16A34A',
  '#D97706',
  '#DC2626',
  '#7C3AED',
  '#0891B2',
  '#DB2777',
  '#65A30D',
]

const WORKDAY_MIN = new Date(0, 0, 0, 8, 0, 0)
const WORKDAY_MAX = new Date(0, 0, 0, 19, 0, 0)

type RepairRowExt = ApiRepairRow & {
  dateDebut?: string
  dateFin?: string
  statut?: string
  diagnostic?: string
}

type RepairCalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    repairId: string
    mechanicId: string
    mechanicName: string
    statut: string
    diagnostic?: string
    color: string
  }
}

const selectFilterClass = cn(
  'rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-ink-primary',
  'focus:outline-none focus:ring-2 focus:ring-clay-primary/30',
)

function repairDateRange(r: RepairRowExt): { start: Date; end: Date } | null {
  const startStr = r.startDate ?? r.dateDebut
  if (!startStr) return null
  const start = new Date(startStr)
  if (Number.isNaN(start.getTime())) return null
  const endStr = r.endDate ?? r.dateFin ?? startStr
  let end = new Date(endStr)
  if (Number.isNaN(end.getTime()) || end <= start) {
    end = new Date(start.getTime() + 60 * 60 * 1000)
  }
  return { start, end }
}

export function RepairsPage(): React.ReactElement {
  const { t } = useTranslation(['repairs', 'common'])
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [mechanicFilter, setMechanicFilter] = useState(
    user?.role === 'mechanic' ? (user.id ?? '') : '',
  )
  const listParams = useMemo(
    () => ({
      mechanicId: mechanicFilter || undefined,
    }),
    [mechanicFilter],
  )
  const { data, isLoading, isError, error, refetch } = useRepairsList(listParams)
  const { data: mechanics = [] } = useMechanics()

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [calView, setCalView] = useState<View>('week')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ApiRepairRow | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const rows = (data?.items ?? []) as RepairRowExt[]

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const name = clientPop(r.clientId)?.name?.toLowerCase() ?? ''
      const matchSearch = !search || name.includes(search.toLowerCase())
      const matchStatus = !statusFilter || r.status === statusFilter
      const mechId = refEntityId(r.mechanicId)
      const matchMech = !mechanicFilter || mechId === mechanicFilter
      return matchSearch && matchStatus && matchMech
    })
  }, [rows, search, statusFilter, mechanicFilter])

  const mechanicColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    let index = 0
    filtered.forEach((r) => {
      const mid = refEntityId(r.mechanicId) || 'none'
      if (!map[mid]) {
        map[mid] = MECHANIC_COLORS[index % MECHANIC_COLORS.length]
        index++
      }
    })
    return map
  }, [filtered])

  const calendarEvents = useMemo((): RepairCalendarEvent[] => {
    return filtered
      .map((r) => {
        const range = repairDateRange(r)
        if (!range) return null
        const mid = refEntityId(r.mechanicId) || 'none'
        const client = clientPop(r.clientId)
        const vehicle = vehiclePop(r.vehicleId)
        const mech = mechanicPop(r.mechanicId)
        const clientName = client?.name ?? 'Client'
        const vehicleLabel = vehicle ? `${vehicle.make} ${vehicle.model}`.trim() : ''
        return {
          id: r.id,
          title: `${clientName} — ${vehicleLabel}`.trim(),
          start: range.start,
          end: range.end,
          resource: {
            repairId: r.id,
            mechanicId: mid,
            mechanicName: mech?.name ?? t('repairs:noMechanic'),
            statut: r.statut ?? r.status,
            diagnostic: r.diagnostic ?? r.diagnosis,
            color: mechanicColorMap[mid] ?? MECHANIC_COLORS[0],
          },
        }
      })
      .filter((e): e is RepairCalendarEvent => e != null)
  }, [filtered, mechanicColorMap, t])

  const withoutDateCount = useMemo(
    () => filtered.filter((r) => !r.startDate && !r.dateDebut).length,
    [filtered],
  )

  const persistRepairMove = useCallback(
    async (event: RepairCalendarEvent, start: Date, end: Date, successMessage: string) => {
      try {
        await api.put(`/repairs/${event.id}`, {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        })
        await qc.invalidateQueries({ queryKey: ['repairs'] })
        toast.success(successMessage)
      } catch {
        toast.error('Erreur lors du déplacement')
        await qc.invalidateQueries({ queryKey: ['repairs'] })
      }
    },
    [qc],
  )

  const handleEventDrop = useCallback(
    async ({ event, start, end }: { event: RepairCalendarEvent; start: Date; end: Date }) => {
      await persistRepairMove(event, start, end, 'Réparation déplacée')
    },
    [persistRepairMove],
  )

  const handleEventResize = useCallback(
    async ({ event, start, end }: { event: RepairCalendarEvent; start: Date; end: Date }) => {
      await persistRepairMove(event, start, end, 'Durée mise à jour')
    },
    [persistRepairMove],
  )

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/repairs/${id}/status`, { status: newStatus })
      await qc.invalidateQueries({ queryKey: ['repairs'] })
      toast.success(t('repairs:statusUpdated'))
    } catch {
      toast.error(t('repairs:statusError'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('repairs:deleteConfirm'))) return
    try {
      await api.delete(`/repairs/${id}`)
      await qc.invalidateQueries({ queryKey: ['repairs'] })
      toast.success(t('repairs:deleteSuccess'))
    } catch {
      toast.error(t('repairs:deleteError'))
    }
  }

  const legendEntries = useMemo(() => {
    return Object.entries(mechanicColorMap).map(([mid, color]) => {
      let label = t('repairs:noMechanic')
      if (mid !== 'none') {
        const fromList = mechanics.find((m) => m.id === mid)?.name
        const fromRepair = mechanicPop(
          filtered.find((r) => refEntityId(r.mechanicId) === mid)?.mechanicId,
        )?.name
        label = fromList ?? fromRepair ?? '—'
      }
      return { mid, color, label }
    })
  }, [mechanicColorMap, mechanics, filtered, t])

  const columns: DataColumn<ApiRepairRow>[] = [
    {
      id: 'client',
      header: t('repairs:colClient'),
      cell: (r) => {
        const c = clientPop(r.clientId)
        return (
          <div>
            <div className="text-sm font-medium text-ink-primary">{c?.name ?? '—'}</div>
            {c?.phone ? <div className="text-xs text-ink-muted">{c.phone}</div> : null}
          </div>
        )
      },
    },
    {
      id: 'vehicle',
      header: t('repairs:colVehicle'),
      cell: (r) => {
        const v = vehiclePop(r.vehicleId)
        return (
          <div>
            <div className="text-sm font-medium text-ink-primary">
              {v ? `${v.make} ${v.model}` : '—'}
            </div>
            {v?.plate ? <div className="text-xs text-ink-muted">{v.plate}</div> : null}
          </div>
        )
      },
    },
    {
      id: 'mech',
      header: t('repairs:colMechanic'),
      cell: (r) => {
        const m = mechanicPop(r.mechanicId)
        return (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                'bg-clay-primary/15 text-xs font-bold text-clay-primary',
              )}
            >
              {m?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <span className="text-sm text-ink-primary">{m?.name ?? '—'}</span>
          </div>
        )
      },
    },
    {
      id: 'notes',
      header: t('repairs:colDiagnosis'),
      cell: (r) => (
        <span className="line-clamp-2 text-xs text-ink-secondary">{r.diagnosis ?? r.notes ?? '—'}</span>
      ),
    },
    {
      id: 'actions',
      header: t('repairs:colActions'),
      cell: (r) => (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button type="button" size="sm" variant="secondary" asChild>
            <Link to={`/repairs/${r.id}`}>{t('repairs:viewDetail')}</Link>
          </Button>
          <button
            type="button"
            title={t('repairs:edit')}
            onClick={() => {
              setEditTarget(r)
              setEditOpen(true)
            }}
            className={cn(
              'rounded-lg border border-[var(--border)] p-1.5',
              'text-clay-primary transition-colors hover:bg-clay-primary/10',
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <select
            value={r.status}
            onChange={(e) => void handleStatusChange(r.id, e.target.value)}
            className={cn(selectFilterClass, 'max-w-[9rem] py-1.5 text-xs font-medium')}
            aria-label={t('common:status')}
          >
            <option value="pending">{t('repairs:statusPending')}</option>
            <option value="in_progress">{t('repairs:statusInProgress')}</option>
            <option value="waiting_parts">{t('repairs:statusWaitingParts')}</option>
            <option value="completed">{t('repairs:statusCompleted')}</option>
            <option value="cancelled">{t('repairs:statusCancelled')}</option>
          </select>
          <button
            type="button"
            title={t('common:delete')}
            onClick={() => void handleDelete(r.id)}
            className={cn(
              'rounded-lg border border-[var(--border)] p-1.5',
              'text-clay-red transition-colors hover:bg-red-50 dark:hover:bg-red-950/20',
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  const calendarMessages = {
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour',
    agenda: 'Agenda',
    today: "Aujourd'hui",
    previous: 'Précédent',
    next: 'Suivant',
    noEventsInRange: 'Aucune réparation sur cette période',
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-fluid-h1 font-semibold text-ink-primary">{t('repairs:title')}</h1>
          <p className="mt-1 text-sm text-ink-secondary">{t('repairs:subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={cn(
              'flex items-center overflow-hidden rounded-xl border border-[var(--border)]',
            )}
          >
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : cn(
                      'bg-[var(--bg-surface)] text-ink-secondary',
                      'hover:bg-[var(--bg-sidebar)]',
                    ),
              )}
            >
              <List className="h-4 w-4" />
              Liste
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
                viewMode === 'calendar'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : cn(
                      'bg-[var(--bg-surface)] text-ink-secondary',
                      'hover:bg-[var(--bg-sidebar)]',
                    ),
              )}
            >
              <CalendarDays className="h-4 w-4" />
              Calendrier
            </button>
          </div>
          <Button type="button" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('repairs:newRepair')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            type="search"
            placeholder={t('repairs:searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] py-2',
              'ps-9 pe-4 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-clay-primary/30',
            )}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectFilterClass}
          aria-label={t('repairs:filterStatus')}
        >
          <option value="">{t('repairs:filterAllStatus')}</option>
          <option value="pending">{t('repairs:statusPending')}</option>
          <option value="in_progress">{t('repairs:statusInProgress')}</option>
          <option value="waiting_parts">{t('repairs:statusWaitingParts')}</option>
          <option value="completed">{t('repairs:statusCompleted')}</option>
          <option value="cancelled">{t('repairs:statusCancelled')}</option>
        </select>
        {user?.role === 'manager' ? (
          <select
            value={mechanicFilter}
            onChange={(e) => setMechanicFilter(e.target.value)}
            className={selectFilterClass}
            aria-label={t('repairs:filterMechanic')}
          >
            <option value="">{t('repairs:filterAllMechanics')}</option>
            {mechanics.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        ) : (
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl border border-[var(--border)]',
              'bg-[var(--bg-surface)] px-3 py-2 text-sm text-ink-secondary',
            )}
          >
            <User className="h-4 w-4 shrink-0" aria-hidden />
            {t('repairs:myRepairsOnly')}
          </div>
        )}
      </div>

      {viewMode === 'calendar' && withoutDateCount > 0 ? (
        <div
          className={cn(
            'mb-3 flex items-center gap-2 rounded-xl border border-amber-200 px-4 py-2.5 text-sm',
            'bg-amber-50 text-amber-700',
            'dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400',
          )}
        >
          <span aria-hidden>⚠</span>
          <span>
            {withoutDateCount} réparation(s) sans date planifiée ne sont pas affichées dans le
            calendrier.
          </span>
        </div>
      ) : null}

      {viewMode === 'calendar' && legendEntries.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-ink-muted">Mécaniciens :</span>
          {legendEntries.map(({ mid, color, label }) => (
            <div key={mid} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <span className="text-xs text-ink-secondary">{label}</span>
            </div>
          ))}
        </div>
      ) : null}

      {viewMode === 'list' ? (
        <ClayCard variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">{t('repairs:listTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryBoundary
              isLoading={isLoading}
              isError={isError}
              error={error as Error}
              onRetry={() => void refetch()}
              isEmpty={!isLoading && filtered.length === 0}
              loading={<TableSkeleton rows={6} />}
              empty={<p className="text-sm text-ink-muted">{t('repairs:empty')}</p>}
            >
              <DataTable columns={columns} data={filtered} getRowKey={(r) => r.id} />
            </QueryBoundary>
          </CardContent>
        </ClayCard>
      ) : (
        <ClayCard variant="elevated">
          <CardContent className="p-3">
            <QueryBoundary
              isLoading={isLoading}
              isError={isError}
              error={error as Error}
              onRetry={() => void refetch()}
              isEmpty={false}
              loading={<TableSkeleton rows={6} />}
              empty={null}
            >
              <div className="rbc-clay">
                <div
                  className={cn(
                    'overflow-hidden rounded-2xl border border-[var(--border)]',
                    'bg-[var(--bg-surface-solid)] p-4 shadow-clay',
                  )}
                  style={{ height: 680 }}
                >
                  <DnDCalendar
                    localizer={localizer}
                    culture="fr"
                    events={calendarEvents}
                    view={calView}
                    onView={setCalView}
                    defaultView="week"
                    views={['month', 'week', 'day', 'agenda']}
                    step={30}
                    timeslots={2}
                    min={WORKDAY_MIN}
                    max={WORKDAY_MAX}
                    draggableAccessor={() => true}
                    resizable
                    style={{ height: '100%' }}
                    eventPropGetter={(event) => {
                      const ev = event as RepairCalendarEvent
                      const color = ev.resource?.color ?? MECHANIC_COLORS[0]
                      return {
                        style: {
                          backgroundColor: color,
                          borderColor: color,
                          color: '#ffffff',
                          borderRadius: '6px',
                          fontSize: '12px',
                          padding: '2px 6px',
                          border: 'none',
                          borderLeft: '3px solid rgba(0,0,0,0.2)',
                        },
                      }
                    }}
                    onSelectEvent={(event) => {
                      navigate(`/repairs/${(event as RepairCalendarEvent).id}`)
                    }}
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventResize}
                    messages={calendarMessages}
                  />
                </div>
              </div>
            </QueryBoundary>
          </CardContent>
        </ClayCard>
      )}

      <RepairCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {editOpen && editTarget ? (
        <RepairEditModal
          repair={editTarget}
          open={editOpen}
          onClose={() => {
            setEditOpen(false)
            setEditTarget(null)
          }}
        />
      ) : null}
    </div>
  )
}
