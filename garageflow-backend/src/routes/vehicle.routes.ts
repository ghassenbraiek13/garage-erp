import { Router } from 'express'
import * as ctrl from '@/controllers/vehicle.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'
import { validateBody } from '@/middleware/validate.middleware'
import { CreateVehicleSchema, UpdateVehicleSchema } from '@/schemas/vehicle.schema'
import { uploadVehiclePhoto } from '@/middleware/upload.middleware'

const r = Router()

r.get(
  '/vin/:vin(*)/matches',
  verifyToken,
  requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'),
  ctrl.vinMatches,
)
r.get(
  '/vin/:vin(*)',
  verifyToken,
  requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'),
  ctrl.vinDecode,
)
r.get('/', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'), ctrl.list)
r.get('/:id/repairs', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'), ctrl.listRepairs)
r.get('/:id', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'), ctrl.getOne)
r.post(
  '/',
  verifyToken,
  requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'),
  validateBody(CreateVehicleSchema),
  ctrl.create,
)
r.put(
  '/:id',
  verifyToken,
  requireRole('manager', 'cashier', 'superadmin'),
  validateBody(UpdateVehicleSchema),
  ctrl.update,
)
r.delete('/:id', verifyToken, requireRole('manager', 'superadmin'), ctrl.remove)
r.post('/:id/photos', verifyToken, requireRole('mechanic', 'manager', 'superadmin'), uploadVehiclePhoto, ctrl.uploadPhotos)

export default r
