import { addDays, addMinutes, format, isBefore, parseISO, setHours, setMinutes, startOfDay } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import api from '@/utils/api'

const SLOT_MINUTES = 30
const DAY_START_H = 8
const DAY_END_H = 18

export function generateSlotTimes(day: Date): Date[] {
  const slots: Date[] = []
  let cursor = setMinutes(setHours(startOfDay(day), DAY_START_H), 0)
  const end = setMinutes(setHours(startOfDay(day), DAY_END_H), 0)
  while (cursor < end) {
    slots.push(new Date(cursor))
    cursor = addMinutes(cursor, SLOT_MINUTES)
  }
  return slots
}

export function slotKey(d: Date): string {
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

export function useAvailableSlots(serviceId: string | undefined, days = 14) {
  return useQuery({
    queryKey: ['appointments', 'available-slots', serviceId, days],
    queryFn: async (): Promise<Set<string>> => {
      const unavailable = new Set<string>()
      try {
        const { data } = await api.get<{ data: string[] }>('/appointments/available-slots', {
          params: { ...(serviceId ? { serviceId } : {}), days },
        })
        for (const iso of data.data ?? []) {
          const d = parseISO(iso)
          unavailable.add(slotKey(d))
        }
        return unavailable
      } catch {
        const from = startOfDay(new Date())
        const to = addDays(from, days)
        try {
          const { data } = await api.get<{ data: { start: string; end: string }[] }>('/appointments', {
            params: {
              start: from.toISOString(),
              end: to.toISOString(),
              limit: 500,
              page: 1,
            },
          })
          for (const appt of data.data ?? []) {
            const start = parseISO(appt.start)
            let cursor = start
            const endAppt = parseISO(appt.end)
            while (isBefore(cursor, endAppt)) {
              unavailable.add(slotKey(cursor))
              cursor = addMinutes(cursor, SLOT_MINUTES)
            }
          }
        } catch {
          /* empty — all slots appear available */
        }
        return unavailable
      }
    },
  })
}

export function buildSlotRange(days: number): Date[] {
  const out: Date[] = []
  const today = startOfDay(new Date())
  for (let i = 0; i < days; i++) {
    out.push(addDays(today, i))
  }
  return out
}
