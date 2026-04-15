import { z } from 'zod'

export const CreateVehicleSchema = z.object({
  clientId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  plate: z.string().min(4).max(12),
  vin: z.string().length(17).optional(),
  make: z.string().min(2),
  model: z.string().min(1),
  year: z.number().int().min(1950).max(new Date().getFullYear() + 1),
  fuelType: z.enum(['essence', 'diesel', 'hybride', 'electrique', 'autre']).optional(),
  mileage: z.number().int().min(0).optional(),
  engine: z.string().optional(),
  color: z.string().optional(),
})

export const UpdateVehicleSchema = CreateVehicleSchema.partial().extend({
  clientId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
})
