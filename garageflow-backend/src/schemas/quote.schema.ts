import { z } from 'zod'

const oid = z.string().regex(/^[0-9a-fA-F]{24}$/)

const lineSchema = z.object({
  type: z.enum(['service', 'part']),
  refId: oid.optional(),
  label: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).optional(),
  tva: z.number().min(0).max(100).optional(),
})

export const CreateQuoteSchema = z.object({
  clientId: oid,
  vehicleId: oid.optional(),
  lines: z.array(lineSchema).min(1),
  validUntil: z.string().datetime().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'invoiced', 'expired']).optional(),
})

export const UpdateQuoteSchema = CreateQuoteSchema.partial()

export const QuoteStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'invoiced', 'expired']),
})
