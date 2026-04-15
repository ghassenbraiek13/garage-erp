import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['superadmin', 'manager', 'mechanic', 'cashier', 'client']).optional(),
})

export const RegisterSchema = z.object({
  garageName: z.string().min(2).max(100),
  garageAddress: z.object({
    street: z.string(),
    city: z.string(),
    postalCode: z.string(),
  }),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must include upper, lower, digit'),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
})

export const UpdateMeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
})
