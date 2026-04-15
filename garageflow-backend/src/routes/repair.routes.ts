import { Router } from 'express'
import * as ctrl from '@/controllers/repair.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'
import { validateBody } from '@/middleware/validate.middleware'
import { AssignMechanicSchema, CreateRepairSchema, RepairStatusSchema, UpdateRepairSchema } from '@/schemas/repair.schema'

const r = Router()

r.get('/', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'), ctrl.list)
r.get('/:id', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'), ctrl.getOne)
r.post(
  '/',
  verifyToken,
  requireRole('manager', 'mechanic', 'superadmin'),
  validateBody(CreateRepairSchema),
  ctrl.create,
)
r.put(
  '/:id',
  verifyToken,
  requireRole('manager', 'mechanic', 'superadmin'),
  validateBody(UpdateRepairSchema),
  ctrl.update,
)
r.patch(
  '/:id/status',
  verifyToken,
  requireRole('manager', 'mechanic', 'superadmin'),
  validateBody(RepairStatusSchema),
  ctrl.patchStatus,
)
r.delete('/:id', verifyToken, requireRole('manager', 'superadmin'), ctrl.remove)
r.post(
  '/:id/assign',
  verifyToken,
  requireRole('manager', 'superadmin'),
  validateBody(AssignMechanicSchema),
  ctrl.assign,
)

export default r
