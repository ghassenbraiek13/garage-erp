import { z } from 'zod'

const oid = z.string().regex(/^[0-9a-fA-F]{24}$/)

export const CreatePartSchema = z.object({
  reference: z.string().min(1),
  name: z.string().min(1),
  category: z
    .enum([
      'filtres',
      'freins',
      'huiles',
      'pneumatiques',
      'electricite',
      'carrosserie',
      'moteur',
      'transmission',
      'suspension',
      'autre',
    ])
    .optional(),
  description: z.string().optional(),
  price: z.number().min(0),
  purchasePrice: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  minStock: z.number().min(0).optional(),
  supplier: z.string().optional(),
  compatibleWith: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  barcode: z.string().optional(),
})

export const UpdatePartSchema = CreatePartSchema.partial()

export const StockPatchSchema = z.object({
  quantity: z.number(),
  operation: z.enum(['add', 'subtract']),
})

export const VisibilitySchema = z.object({
  isPublic: z.boolean(),
})
