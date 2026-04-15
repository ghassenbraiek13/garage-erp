import type { CSSProperties } from 'react'
import { format, getDay, parse, startOfWeek } from 'date-fns'
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
import { mockAppointments } from '@/mocks/mockAppointments'
import { mockMechanics } from '@/mocks/mockMechanics'

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

export function PlanningPage() {
  const { t } = useTranslation(['planning', 'common'])
  const [mechanic, setMechanic] = useState<string>('all')
  const [open, setOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<{ title: string; start?: Date; end?: Date } | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState<View>('week')

  const events = useMemo(() => {
    return mockAppointments
      .filter((a) => (mechanic === 'all' ? true : a.mechanicId === mechanic))
      .map((a) => ({
        id: a.id,
        title: `${a.type} · ${a.id}`,
        start: new Date(a.start),
        end: new Date(a.end),
        meta: a,
      }))
  }, [mechanic])

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
          <p className="text-sm text-ink-secondary">React Big Calendar + date-fns (vue alternative FullCalendar)</p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          {t('planning:newSlot')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={mechanic === 'all' ? 'primary' : 'default'} className="cursor-pointer" onClick={() => setMechanic('all')}>
          Tous
        </Badge>
        {mockMechanics.map((m) => (
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
            Filtre mécanicien + vues jour/semaine/mois. Glisser-déposer simulé via interaction (démo).
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
                selectable
                onSelectEvent={(ev) => {
                  setSelected({ title: String(ev.title), start: ev.start, end: ev.end })
                  setDetailOpen(true)
                }}
                onSelectSlot={() => setOpen(true)}
                eventPropGetter={(ev) => {
                  const e = ev as { meta?: { type: keyof typeof colorMap } }
                  const k = e.meta?.type ?? 'repair'
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
            <DialogDescription>Créneau fictif — connectez votre API pour persister.</DialogDescription>
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
