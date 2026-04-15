import { Router } from 'express'
import * as ctrl from '@/controllers/client.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'
import { validateBody } from '@/middleware/validate.middleware'
import { AddPointsSchema, CreateClientSchema, UpdateClientSchema } from '@/schemas/client.schema'

const r = Router()

r.get('/', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.list)
r.get('/export/excel', verifyToken, requireRole('manager', 'superadmin'), ctrl.exportExcel)
r.get('/export/pdf', verifyToken, requireRole('manager', 'superadmin'), ctrl.exportPdf)
r.get('/:id', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.getOne)
r.post('/', verifyToken, requireRole('manager', 'cashier', 'superadmin'), validateBody(CreateClientSchema), ctrl.create)
r.put('/:id', verifyToken, requireRole('manager', 'cashier', 'superadmin'), validateBody(UpdateClientSchema), ctrl.update)
r.delete('/:id', verifyToken, requireRole('manager', 'superadmin'), ctrl.remove)
r.get('/:id/vehicles', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.vehicles)
r.get('/:id/repairs', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.repairs)
r.get('/:id/invoices', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.invoices)
r.get('/:id/loyalty', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.loyalty)
r.post(
  '/:id/add-points',
  verifyToken,
  requireRole('manager', 'cashier', 'superadmin'),
  validateBody(AddPointsSchema),
  ctrl.addPoints,
)

export default r
