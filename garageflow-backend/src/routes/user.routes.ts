import { Router } from 'express'
import * as ctrl from '@/controllers/user.controller'
import * as authCtrl from '@/controllers/auth.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'
import { validateBody } from '@/middleware/validate.middleware'
import { ActiveSchema, CreateStaffSchema, UpdateUserSchema } from '@/schemas/user.schema'
import { uploadAvatar } from '@/middleware/upload.middleware'

const r = Router()

r.get('/mechanics', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'client', 'superadmin'), ctrl.mechanics)
r.get('/', verifyToken, requireRole('manager', 'superadmin'), ctrl.list)
r.get('/:id', verifyToken, requireRole('manager', 'superadmin'), ctrl.getOne)
r.post('/', verifyToken, requireRole('manager', 'superadmin'), validateBody(CreateStaffSchema), ctrl.create)
r.put('/:id', verifyToken, requireRole('manager', 'superadmin'), validateBody(UpdateUserSchema), ctrl.update)
r.patch('/:id/active', verifyToken, requireRole('manager', 'superadmin'), validateBody(ActiveSchema), ctrl.patchActive)
r.delete('/:id', verifyToken, requireRole('manager', 'superadmin'), ctrl.remove)
r.post('/:id/avatar', verifyToken, uploadAvatar, authCtrl.uploadAvatar)

export default r
