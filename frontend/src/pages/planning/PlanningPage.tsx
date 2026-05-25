import axios from 'axios'

import { useQueryClient } from '@tanstack/react-query'

import { addDays, endOfMonth, format, getDay, parse, startOfMonth, startOfWeek, subDays } from 'date-fns'

import { fr } from 'date-fns/locale'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { Calendar, dateFnsLocalizer, type SlotInfo, type View } from 'react-big-calendar'

import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'

import { useTranslation } from 'react-i18next'

import { toast } from 'sonner'

import { useSearchParams } from 'react-router-dom'

import 'react-big-calendar/lib/css/react-big-calendar.css'

import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

import '@/styles/calendar.css'

import { AppointmentDetailModal } from '@/components/planning/AppointmentDetailModal'
import { RdvModal } from '@/components/planning/RdvModal'

import { Button } from '@/components/ui/button'

import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


import { useAppointmentsList, useDeleteAppointment, type ApiAppointment } from '@/hooks/api/useAppointments'

import { useMechanics } from '@/hooks/api/useUsers'

import { cn } from '@/lib/utils'

import api from '@/utils/api'

import { useAuthStore } from '@/store/auth'



const DnDCalendar = withDragAndDrop(Calendar)



const localizer = dateFnsLocalizer({

  format,

  parse,

  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),

  getDay,

  locales: { fr },

})



/** Heures affichées (semaine / jour) — 08:00–19:00 */

const WORKDAY_MIN = new Date(0, 0, 0, 8, 0, 0)

const WORKDAY_MAX = new Date(0, 0, 0, 19, 0, 0)

const SCROLL_TO_TIME = new Date(0, 0, 0, 8, 0, 0)



type PlanningEvent = {

  id: string

  title: string

  start: Date

  end: Date

  mechanicId?: string | null

}



function refId(x: unknown): string {
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>
    if (o.id != null) return String(o.id)
    if (o._id != null) return String(o._id)
  }
  return String(x ?? '')
}

function mechanicIdFromAppt(appt: ApiAppointment): string | null {
  const m = appt.mechanicId
  if (!m) return null
  if (typeof m === 'string') return m || null
  if (typeof m === 'object') {
    const o = m as Record<string, unknown>
    if (o.id != null) return String(o.id)
    if (o._id != null) return String(o._id)
  }
  return null
}



function handlePlanningSlot(

  currentView: View,

  slotInfo: SlotInfo,

  openModal: (opts: { date?: Date; time?: string; lock: boolean }) => void,

) {

  if (currentView === 'agenda') return



  if (currentView === 'month') {

    openModal({ date: slotInfo.start, time: undefined, lock: false })

    return

  }



  if (currentView === 'week') {

    const h = slotInfo.start.getHours().toString().padStart(2, '0')

    const m = slotInfo.start.getMinutes() < 30 ? '00' : '30'

    const raw = `${h}:${m}`

    const clamped = raw < '08:00' ? '08:00' : raw > '18:00' ? '18:00' : raw

    openModal({ date: slotInfo.start, time: clamped, lock: false })

    return

  }



  if (currentView === 'day') {

    const h = slotInfo.start.getHours().toString().padStart(2, '0')

    const m = slotInfo.start.getMinutes() < 30 ? '00' : '30'

    const raw = `${h}:${m}`

    const clamped = raw < '08:00' ? '08:00' : raw > '18:00' ? '18:00' : raw

    openModal({ date: slotInfo.start, time: clamped, lock: true })

  }

}



export function PlanningPage(): React.ReactElement {

  const { t, i18n } = useTranslation(['planning', 'common'])

  const qc = useQueryClient()

  const user = useAuthStore((s) => s.user)

  const [selectedMechanic, setSelectedMechanic] = useState<string | null>(
    user?.role === 'mechanic' ? user.id : null,
  )

  const [modalOpen, setModalOpen] = useState(false)

  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

  const [selectedTime, setSelectedTime] = useState<string | undefined>()

  const [lockDate, setLockDate] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)

  const [selectedAppt, setSelectedAppt] = useState<ApiAppointment | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()

  const [currentView, setCurrentView] = useState<View>('week')

  const [calDate, setCalDate] = useState(() => new Date())



  const range = useMemo(() => {

    const sm = startOfMonth(calDate)

    const em = endOfMonth(calDate)

    return { start: subDays(sm, 7).toISOString(), end: addDays(em, 7).toISOString() }

  }, [calDate])



  const { data: apptData, isLoading } = useAppointmentsList(range)

  const { data: mechanics } = useMechanics()

  const deleteAppt = useDeleteAppointment()

  const rawItems = apptData?.items ?? []



  const events = useMemo((): PlanningEvent[] => {
    return rawItems.map((a) => ({
      id: a.id,
      title: `RDV · ${refId(a.clientId).slice(-4)}`,
      start: new Date(a.start),
      end: new Date(a.end),
      mechanicId: mechanicIdFromAppt(a),
    }))
  }, [rawItems])

  const filteredEvents = useMemo((): PlanningEvent[] => {
    if (!selectedMechanic) return events
    return events.filter((event) => event.mechanicId === selectedMechanic)
  }, [events, selectedMechanic])

  const planningSubtitle = i18n.resolvedLanguage?.startsWith('ar')
    ? 'إدارة المواعيد والإصلاحات'
    : 'Gestion des rendez-vous et réparations'



  const persistMove = useCallback(

    async (event: PlanningEvent, start: Date, end: Date) => {

      try {

        await api.put(`/appointments/${event.id}`, {

          start: start.toISOString(),

          end: end.toISOString(),

          mechanicId: event.mechanicId || undefined,

        })

        void qc.invalidateQueries({ queryKey: ['appointments'] })

        toast.success(t('planning:slotMoved'))

      } catch (err) {

        if (axios.isAxiosError(err) && err.response?.status === 409) {

          toast.error(t('planning:slotConflict'))

        } else {

          toast.error(t('planning:slotMoveError'))

        }

        void qc.invalidateQueries({ queryKey: ['appointments'] })

      }

    },

    [qc, t],

  )



  const handleEventDrop = useCallback(

    async ({ event, start, end }: { event: PlanningEvent; start: Date; end: Date }) => {

      await persistMove(event, start, end)

    },

    [persistMove],

  )



  const handleEventResize = useCallback(

    async ({ event, start, end }: { event: PlanningEvent; start: Date; end: Date }) => {

      await persistMove(event, start, end)

    },

    [persistMove],

  )



  const closeModal = () => {

    setModalOpen(false)

    setSelectedDate(undefined)

    setSelectedTime(undefined)

    setLockDate(false)

  }



  const openModalFromSlot = (opts: { date?: Date; time?: string; lock: boolean }) => {

    setSelectedDate(opts.date)

    setSelectedTime(opts.time)

    setLockDate(opts.lock)

    setModalOpen(true)

  }



  useEffect(() => {

    if (searchParams.get('new') === '1') {

      setSelectedDate(undefined)

      setSelectedTime(undefined)

      setLockDate(false)

      setModalOpen(true)

      setSearchParams({}, { replace: true })

    }

  }, [searchParams, setSearchParams])



  useEffect(() => {

    const mq = window.matchMedia('(max-width: 640px)')

    const apply = () => setCurrentView(mq.matches ? 'day' : 'week')

    apply()

    mq.addEventListener('change', apply)

    return () => mq.removeEventListener('change', apply)

  }, [])



  return (

    <div className="space-y-4">

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        <div>

          <h1 className="text-fluid-h1 font-semibold">{t('planning:title')}</h1>

          <p className="text-sm text-ink-secondary">{planningSubtitle}</p>

        </div>

        <Button

          type="button"

          onClick={() => {

            setSelectedDate(undefined)

            setSelectedTime(undefined)

            setLockDate(false)

            setModalOpen(true)

          }}

        >

          {t('planning:newSlot')}

        </Button>

      </div>



      {user?.role === 'manager' ? (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedMechanic(null)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
            selectedMechanic === null
              ? 'bg-[var(--accent-primary)] text-white'
              : cn(
                  'border border-[var(--border)] bg-[var(--bg-surface)] text-ink-secondary',
                  'hover:bg-[var(--bg-sidebar)]',
                ),
          )}
        >
          Tous
        </button>
        {(mechanics ?? []).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedMechanic(m.id)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              selectedMechanic === m.id
                ? 'bg-[var(--accent-primary)] text-white'
                : cn(
                    'border border-[var(--border)] bg-[var(--bg-surface)] text-ink-secondary',
                    'hover:bg-[var(--bg-sidebar)]',
                  ),
            )}
          >
            {m.name}
          </button>
        ))}
      </div>
      ) : null}



      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[220px_1fr]">

        <ClayCard variant="elevated" className="h-fit">

          <CardHeader>

            <CardTitle className="text-base">{t('planning:agenda')}</CardTitle>

          </CardHeader>

          <CardContent className="text-sm text-ink-secondary">

            {isLoading
              ? t('common:loading')
              : `${filteredEvents.length} créneau(x) sur la période affichée.`}

          </CardContent>

        </ClayCard>



        <ClayCard variant="elevated">

          <CardContent className="p-3">

            <div className="rbc-clay">

              <div dir="ltr" className="w-full">

                <div

                  className={cn(

                    'rounded-2xl overflow-hidden border border-[var(--border)] shadow-clay bg-[var(--bg-surface-solid)] p-4',

                  )}

                >

                  <DnDCalendar

                    localizer={localizer}

                    culture="fr"

                    events={filteredEvents}

                    startAccessor="start"

                    endAccessor="end"

                    style={{ height: 620 }}

                    view={currentView}

                    onView={(v) => setCurrentView(v)}

                    date={calDate}

                    onNavigate={(d) => setCalDate(d)}

                    min={WORKDAY_MIN}

                    max={WORKDAY_MAX}

                    scrollToTime={SCROLL_TO_TIME}

                    selectable

                    draggableAccessor={() => true}

                    resizable

                    onEventDrop={handleEventDrop}

                    onEventResize={handleEventResize}

                    onSelectEvent={(ev) => {

                      const e = ev as PlanningEvent

                      const appt = rawItems.find((a) => a.id === e.id) ?? null

                      setSelectedAppt(appt)

                      setDetailOpen(true)

                    }}

                    onSelectSlot={(slotInfo) => handlePlanningSlot(currentView, slotInfo, openModalFromSlot)}

                    eventPropGetter={() => ({})}

                  />

                </div>

              </div>

            </div>

          </CardContent>

        </ClayCard>

      </div>



      <RdvModal

        open={modalOpen}

        onClose={closeModal}

        defaultDate={selectedDate}

        defaultTime={selectedTime}

        lockDate={lockDate}

      />



      <AppointmentDetailModal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setSelectedAppt(null)
        }}
        appointment={selectedAppt}
        deletePending={deleteAppt.isPending}
        onDelete={
          selectedAppt
            ? () => {
                void (async () => {
                  try {
                    await deleteAppt.mutateAsync(selectedAppt.id)
                    toast.success(t('planning:rdvDeleted'))
                    setDetailOpen(false)
                    setSelectedAppt(null)
                  } catch (e) {
                    let msg = t('planning:rdvDeleteError')
                    if (axios.isAxiosError(e)) {
                      const m = (e.response?.data as { message?: string } | undefined)?.message
                      if (m) msg = m
                    }
                    toast.error(msg)
                  }
                })()
              }
            : undefined
        }
      />

    </div>

  )

}


