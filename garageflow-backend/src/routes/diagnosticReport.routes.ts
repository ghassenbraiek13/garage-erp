import { Router } from 'express'
import * as ctrl from '@/controllers/diagnosticReport.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'
import { validateBody } from '@/middleware/validate.middleware'
import {
  CreateDiagnosticReportSchema,
  UpdateDiagnosticReportSchema,
} from '@/schemas/diagnosticReport.schema'

const r = Router()

r.get(
  '/',
  verifyToken,
  requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'),
  ctrl.list,
)
r.get(
  '/:id',
  verifyToken,
  requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'),
  ctrl.getOne,
)
r.post(
  '/',
  verifyToken,
  requireRole('manager', 'mechanic', 'superadmin'),
  validateBody(CreateDiagnosticReportSchema),
  ctrl.create,
)
r.put(
  '/:id',
  verifyToken,
  requireRole('manager', 'mechanic', 'superadmin'),
  validateBody(UpdateDiagnosticReportSchema),
  ctrl.update,
)
r.patch(
  '/:id/finalize',
  verifyToken,
  requireRole('manager', 'mechanic', 'superadmin'),
  ctrl.finalize,
)
r.delete('/:id', verifyToken, requireRole('manager', 'superadmin'), ctrl.remove)

export default r
