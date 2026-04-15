import { z } from 'zod'

const oidOpt = z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable()

export const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
  vehicleId: oidOpt,
  repairId: oidOpt,
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  dueDate: z.string().datetime().optional(),
})

export const UpdateTaskSchema = CreateTaskSchema.partial()

export const TaskStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done']),
})
