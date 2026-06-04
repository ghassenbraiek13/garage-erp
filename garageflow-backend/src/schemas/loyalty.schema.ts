import { z } from 'zod'

const oid = z.string().regex(/^[0-9a-fA-F]{24}$/)

export const ApplyCouponSchema = z.object({
  couponCode: z.string().min(2),
  quoteId: oid,
})
