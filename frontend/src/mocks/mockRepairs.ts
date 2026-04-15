import type { Repair } from '@/types'

export const mockRepairs: Repair[] = Array.from({ length: 20 }).map((_, i) => {
  const statuses = ['pending', 'in_progress', 'completed', 'cancelled'] as const
  const st = statuses[i % 4]
  return {
    id: `r-${i + 1}`,
    vehicleId: `v-${(i % 25) + 1}`,
    clientId: `c-${(i % 15) + 1}`,
    mechanicId: `m-${(i % 3) + 1}`,
    serviceIds: [`s-${(i % 5) + 1}`],
    status: st,
    startDate: new Date(2026, 3, 1 + (i % 20)).toISOString(),
    endDate: st === 'completed' ? new Date(2026, 3, 2 + (i % 20)).toISOString() : undefined,
    notes: 'Contrôle freins / vidange',
    type: i % 3 === 0 ? 'Réparation' : i % 3 === 1 ? 'Révision' : 'Diagnostic',
  }
})
