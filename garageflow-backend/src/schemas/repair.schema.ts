import { z } from 'zod'

const oid = z.string().regex(/^[0-9a-fA-F]{24}$/)

export const CreateRepairSchema = z.object({
  vehicleId: oid,
  clientId: oid,
  mechanicId: oid.optional(),
  serviceIds: z.array(oid).optional(),
  status: z
    .enum(['pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled'])
    .optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  estimatedDuration: z.number().int().min(0).optional(),
  startDate: z.string().datetime().optional(),
})

export const UpdateRepairSchema = CreateRepairSchema.partial()

export const RepairStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled']),
})

export const AssignMechanicSchema = z.object({
  mechanicId: oid,
})
