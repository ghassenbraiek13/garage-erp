import { z } from 'zod'

export const CreateStaffSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  name: z.string().min(2).max(100),
  role: z.enum(['mechanic', 'cashier']),
})

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['mechanic', 'cashier', 'manager']).optional(),
})

export const ActiveSchema = z.object({
  isActive: z.boolean(),
})
