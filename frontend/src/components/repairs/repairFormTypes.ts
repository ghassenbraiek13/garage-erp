import { z } from 'zod'

export const repairFormSchema = z.object({
  clientId: z.string().min(1, 'Client requis'),
  vehicleId: z.string().min(1, 'Véhicule requis'),
  diagnosis: z.string().min(2, 'Diagnostic requis'),
  mechanicId: z.string().optional(),
  serviceIds: z.array(z.string()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  estimatedDuration: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
})

export type RepairFormValues = z.infer<typeof repairFormSchema>

export type RepairClientPop = {
  id?: string
  name: string
  email?: string
  phone?: string
}

export type RepairVehiclePop = {
  id?: string
  make: string
  model: string
  plate?: string
  year?: number
}

export type RepairMechanicPop = {
  id?: string
  name: string
  avatar?: string
}

export type RepairServicePop = {
  id?: string
  name: string
  price?: number
}

export type ApiRepairRow = {
  id: string
  status: string
  priority?: string
  diagnosis?: string
  notes?: string
  internalNotes?: string
  startDate?: string
  endDate?: string
  estimatedDuration?: number
  clientId: RepairClientPop | string
  vehicleId: RepairVehiclePop | string
  mechanicId?: RepairMechanicPop | string | null
  serviceIds?: (RepairServicePop | string)[]
}

export function refEntityId(x: unknown): string {
  if (!x) return ''
  if (typeof x === 'string') return x
  if (typeof x === 'object') {
    const o = x as Record<string, unknown>
    if (o.id) return String(o.id)
    if (o._id) return String(o._id)
  }
  return ''
}

export function clientPop(x: unknown): RepairClientPop | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  if (typeof o.name !== 'string') return null
  return {
    id: refEntityId(x),
    name: o.name,
    email: typeof o.email === 'string' ? o.email : undefined,
    phone: typeof o.phone === 'string' ? o.phone : undefined,
  }
}

export function vehiclePop(x: unknown): RepairVehiclePop | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  if (typeof o.make !== 'string' || typeof o.model !== 'string') return null
  return {
    id: refEntityId(x),
    make: o.make,
    model: o.model,
    plate: typeof o.plate === 'string' ? o.plate : undefined,
    year: typeof o.year === 'number' ? o.year : undefined,
  }
}

export function mechanicPop(x: unknown): RepairMechanicPop | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  if (typeof o.name !== 'string') return null
  return {
    id: refEntityId(x),
    name: o.name,
    avatar: typeof o.avatar === 'string' ? o.avatar : undefined,
  }
}

export function toApiBody(values: RepairFormValues): Record<string, unknown> {
  const body: Record<string, unknown> = {
    clientId: values.clientId,
    vehicleId: values.vehicleId,
    diagnosis: values.diagnosis,
    priority: values.priority,
    notes: values.notes || undefined,
    internalNotes: values.internalNotes || undefined,
    estimatedDuration: values.estimatedDuration,
    serviceIds: values.serviceIds?.length ? values.serviceIds : undefined,
    mechanicId: values.mechanicId || undefined,
  }
  if (values.startDate) {
    body.startDate = new Date(values.startDate).toISOString()
  }
  return body
}

export const selectClass =
  'flex h-10 w-full rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--bg-input)] px-3 text-sm text-ink-primary'
