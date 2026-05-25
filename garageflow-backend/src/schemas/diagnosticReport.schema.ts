import { z } from 'zod'

const oid = z.string().regex(/^[0-9a-fA-F]{24}$/)

export const CreateDiagnosticReportSchema = z.object({
  repairId: oid.optional(),
  appointmentId: oid.optional(),
  vehicleId: oid,
  clientId: oid,
  mechanicId: oid.optional(),
  serviceId: oid,
  title: z.string().min(3).max(200),
  findings: z.string().min(10),
  recommendations: z.string().min(5),
  clientSummary: z.string().min(10),
  internalNotes: z.string().optional(),
  visibleToClient: z.boolean().optional(),
})

export const UpdateDiagnosticReportSchema = CreateDiagnosticReportSchema.partial().extend({
  status: z.enum(['draft', 'finalized']).optional(),
})
