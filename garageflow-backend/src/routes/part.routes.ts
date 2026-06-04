import { Router } from 'express'
import * as ctrl from '@/controllers/part.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'
import { validateBody } from '@/middleware/validate.middleware'
import { CreatePartSchema, StockPatchSchema, UpdatePartSchema, VisibilitySchema } from '@/schemas/part.schema'
import { uploadPartPhoto } from '@/middleware/upload.middleware'

const r = Router()

r.get('/stock-check', verifyToken, requireRole('manager', 'superadmin'), ctrl.stockCheck)
r.get('/low-stock', verifyToken, requireRole('manager', 'superadmin'), ctrl.lowStock)
r.get('/export/excel', verifyToken, requireRole('manager', 'superadmin'), ctrl.exportExcel)
r.get('/', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'), ctrl.list)
r.get('/:id', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'), ctrl.getOne)
r.post('/', verifyToken, requireRole('manager', 'superadmin'), validateBody(CreatePartSchema), ctrl.create)
r.put('/:id', verifyToken, requireRole('manager', 'superadmin'), validateBody(UpdatePartSchema), ctrl.update)
r.delete('/:id', verifyToken, requireRole('manager', 'superadmin'), ctrl.remove)
r.patch(
  '/:id/stock',
  verifyToken,
  requireRole('manager', 'mechanic', 'superadmin'),
  validateBody(StockPatchSchema),
  ctrl.patchStock,
)
r.patch(
  '/:id/visibility',
  verifyToken,
  requireRole('manager', 'superadmin'),
  validateBody(VisibilitySchema),
  ctrl.patchVisibility,
)
r.post('/:id/photos', verifyToken, requireRole('manager', 'superadmin'), uploadPartPhoto, ctrl.uploadPhotos)

export default r
