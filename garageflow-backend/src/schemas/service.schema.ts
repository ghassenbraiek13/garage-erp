import { z } from 'zod'

export const CreateServiceSchema = z.object({
  name: z.string().min(1),
  category: z.enum([
    'lavage',
    'vidange',
    'freinage',
    'diagnostic',
    'pneumatique',
    'carrosserie',
    'electricite',
    'climatisation',
    'autre',
  ]),
  description: z.string().optional(),
  diagnosticKind: z.enum(['general', 'purchase_consultation', 'purchase_general']).optional().nullable(),
  price: z.number().min(0),
  duration: z.number().int().min(1),
  isActive: z.boolean().optional(),
  isCustom: z.boolean().optional(),
})

export const UpdateServiceSchema = CreateServiceSchema.partial()
