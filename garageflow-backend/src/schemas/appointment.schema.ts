import { z } from 'zod'

const AppointmentFields = z.object({
  clientId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  vehicleId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  mechanicId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  notes: z.string().max(500).optional(),
})

export const CreateAppointmentSchema = AppointmentFields.refine((data) => new Date(data.end) > new Date(data.start), {
  message: 'end must be after start',
  path: ['end'],
})

export const UpdateAppointmentSchema = AppointmentFields.partial()

export const AppointmentStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']),
})
