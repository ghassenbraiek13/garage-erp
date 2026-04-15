import { addDays, setHours, setMinutes } from 'date-fns'
import type { Appointment } from '@/types'

const base = new Date()

export const mockAppointments: Appointment[] = Array.from({ length: 18 }).map((_, i) => {
  const day = addDays(base, (i % 14) + 1)
  const start = setMinutes(setHours(day, 9 + (i % 6)), i % 2 === 0 ? 0 : 30)
  const end = setMinutes(setHours(start, start.getHours() + 1), start.getMinutes())
  const types = ['repair', 'revision', 'wash'] as const
  const t = types[i % 3]
  return {
    id: `a-${i + 1}`,
    clientId: `c-${(i % 15) + 1}`,
    vehicleId: `v-${(i % 25) + 1}`,
    serviceId: `s-${(i % 5) + 1}`,
    mechanicId: `m-${(i % 3) + 1}`,
    start: start.toISOString(),
    end: end.toISOString(),
    notes: 'RDV atelier',
    status: i % 5 === 0 ? 'pending' : 'confirmed',
    type: t,
  }
})
