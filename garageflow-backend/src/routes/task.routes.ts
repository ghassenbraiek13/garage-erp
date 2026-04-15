import { Router } from 'express'
import * as ctrl from '@/controllers/task.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'
import { validateBody } from '@/middleware/validate.middleware'
import { CreateTaskSchema, TaskStatusSchema, UpdateTaskSchema } from '@/schemas/task.schema'

const r = Router()

r.get('/kanban', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'), ctrl.kanban)
r.get('/', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'), ctrl.list)
r.get('/:id', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'), ctrl.getOne)
r.post(
  '/',
  verifyToken,
  requireRole('manager', 'mechanic', 'superadmin'),
  validateBody(CreateTaskSchema),
  ctrl.create,
)
r.put(
  '/:id',
  verifyToken,
  requireRole('manager', 'mechanic', 'superadmin'),
  validateBody(UpdateTaskSchema),
  ctrl.update,
)
r.patch(
  '/:id/status',
  verifyToken,
  requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'),
  validateBody(TaskStatusSchema),
  ctrl.patchStatus,
)
r.delete('/:id', verifyToken, requireRole('manager', 'superadmin'), ctrl.remove)

export default r
