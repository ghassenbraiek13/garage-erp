import type { CSSProperties } from 'react'
import { addDays, endOfMonth, format, getDay, parse, startOfMonth, startOfWeek, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEffect, useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppointmentsList, type ApiAppointment } from '@/hooks/api/useAppointments'
import { useMechanics } from '@/hooks/api/useUsers'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { fr },
})

const colorMap = {
  repair: '#2563eb',
  revision: '#10b981',
  wash: '#f59e0b',
} as const

function refId(x: unknown): string {
  if (x && typeof x === 'object' && '_id' in x) return String((x as { _id: unknown })._id)
  return String(x ?? '')
}

export function PlanningPage(): React.ReactElement {
  const { t } = useTranslation(['planning', 'common'])
  const [mechanic, setMechanic] = useState<string>('all')
  const [open, setOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<{ title: string; start?: Date; end?: Date } | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState<View>('week')
  const [calDate, setCalDate] = useState(() => new Date())

  const range = useMemo(() => {
    const sm = startOfMonth(calDate)
    const em = endOfMonth(calDate)
    return { start: subDays(sm, 7).toISOString(), end: addDays(em, 7).toISOString() }
  }, [calDate])

  const { data: apptData, isLoading } = useAppointmentsList(range)
  const { data: mechanics } = useMechanics()
  const rawItems = apptData?.items ?? []

  const events = useMemo(() => {
    return rawItems
      .filter((a) => (mechanic === 'all' ? true : refId(a.mechanicId) === mechanic))
      .map((a) => ({
        id: a.id,
        title: `RDV · ${refId(a.clientId).slice(-4)}`,
        start: new Date(a.start),
        end: new Date(a.end),
        meta: a,
      }))
  }, [rawItems, mechanic])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const apply = () => setView(mq.matches ? 'day' : 'week')
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-fluid-h1 font-semibold">{t('planning:title')}</h1>
          <p className="text-sm text-ink-secondary">Planning connecté à l&apos;API</p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          {t('planning:newSlot')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={mechanic === 'all' ? 'primary' : 'default'} className="cursor-pointer" onClick={() => setMechanic('all')}>
          Tous
        </Badge>
        {(mechanics ?? []).map((m) => (
          <Badge
            key={m.id}
            variant={mechanic === m.id ? 'primary' : 'default'}
            className="cursor-pointer"
            onClick={() => setMechanic(m.id)}
          >
            {m.name}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[220px_1fr]">
        <ClayCard variant="elevated" className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Agenda</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-ink-secondary">
            {isLoading ? 'Chargement…' : `${events.length} créneau(x) sur la période affichée.`}
          </CardContent>
        </ClayCard>

        <ClayCard variant="elevated">
          <CardContent className="p-3">
            <div className="rbc-clay [&_.rbc-toolbar]:flex-wrap [&_.rbc-toolbar]:gap-2 [&_.rbc-event]:rounded-lg [&_.rbc-event]:border-0 [&_.rbc-today]:bg-clay-primary/5">
              <Calendar
                localizer={localizer}
                culture="fr"
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 620 }}
                view={view}
                onView={(v) => setView(v)}
                date={calDate}
                onNavigate={(d) => setCalDate(d)}
                selectable
                onSelectEvent={(ev) => {
                  setSelected({ title: String(ev.title), start: ev.start, end: ev.end })
                  setDetailOpen(true)
                }}
                onSelectSlot={() => setOpen(true)}
                eventPropGetter={(ev) => {
                  const e = ev as { meta?: ApiAppointment }
                  const st = e.meta?.status
                  const k = st === 'cancelled' ? 'wash' : 'repair'
                  const bg = colorMap[k] ?? colorMap.repair
                  return { style: { backgroundColor: bg, border: 'none', color: '#fff' } as CSSProperties }
                }}
              />
            </div>
          </CardContent>
        </ClayCard>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('planning:newSlot')}</DialogTitle>
            <DialogDescription>Créneau — branchement formulaire POST /appointments à finaliser.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Début</Label>
              <Input type="datetime-local" />
            </div>
            <div className="space-y-2">
              <Label>Fin</Label>
              <Input type="datetime-local" />
            </div>
          </div>
          <Button className="w-full" type="button" onClick={() => setOpen(false)}>
            {t('common:save')}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détail événement</DialogTitle>
            <DialogDescription>{selected?.title}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setDetailOpen(false)}>
              {t('common:close')}
            </Button>
            <Button variant="danger" type="button" onClick={() => setDetailOpen(false)}>
              {t('common:delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
