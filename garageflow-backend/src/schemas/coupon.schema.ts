import { z } from 'zod'

const oid = z.string().regex(/^[0-9a-fA-F]{24}$/)

export const CreateCouponSchema = z.object({
  code: z.string().min(2).max(32).optional(),
  type: z.enum(['percentage', 'fixed', 'free_service']),
  value: z.number().min(0).optional(),
  minSpend: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  clientId: oid.optional().nullable(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
})

export const UpdateCouponSchema = CreateCouponSchema.partial()

export const ValidateCouponSchema = z.object({
  code: z.string().min(2),
  amount: z.number().min(0),
})

export const RedeemCouponSchema = z.object({
  code: z.string().min(2),
  invoiceId: oid,
})
