import { z } from 'zod'

export const CreateClientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^(\+33|0)[1-9](\d{8})$/),
  address: z
    .object({
      street: z.string(),
      city: z.string(),
      postalCode: z.string(),
    })
    .optional(),
  notes: z.string().max(500).optional(),
})

export const UpdateClientSchema = CreateClientSchema.partial()

export const AddPointsSchema = z.object({
  points: z.number().int(),
  reason: z.string().max(200).optional(),
})

export const PortalAccessSchema = z.object({
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .optional(),
  sendEmail: z.boolean().optional(),
})
