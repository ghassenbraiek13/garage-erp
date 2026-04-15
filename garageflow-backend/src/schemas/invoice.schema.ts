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

export const CreateInvoiceSchema = z.object({
  clientId: oid,
  vehicleId: oid.optional(),
  quoteId: oid.optional(),
  repairId: oid.optional(),
  lines: z.array(lineSchema).min(1),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  status: z.enum(['unpaid', 'partial', 'paid', 'overdue', 'cancelled']).optional(),
})

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial()

export const PayInvoiceSchema = z.object({
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'cheque']),
})
