import { Router } from 'express'
import * as ctrl from '@/controllers/appointment.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'
import { validateBody } from '@/middleware/validate.middleware'
import {
  AppointmentStatusSchema,
  CreateAppointmentSchema,
  UpdateAppointmentSchema,
} from '@/schemas/appointment.schema'

const r = Router()

r.get('/upcoming', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'), ctrl.upcoming)
r.get('/', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'), ctrl.list)
r.get('/:id', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'), ctrl.getOne)
r.post(
  '/',
  verifyToken,
  requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'),
  validateBody(CreateAppointmentSchema),
  ctrl.create,
)
r.put(
  '/:id',
  verifyToken,
  requireRole('manager', 'cashier', 'superadmin'),
  validateBody(UpdateAppointmentSchema),
  ctrl.update,
)
r.patch(
  '/:id/status',
  verifyToken,
  requireRole('manager', 'cashier', 'superadmin'),
  validateBody(AppointmentStatusSchema),
  ctrl.patchStatus,
)
r.delete('/:id', verifyToken, requireRole('manager', 'superadmin'), ctrl.remove)

export default r
