import { Router } from 'express'
import * as ctrl from '@/controllers/garage.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'
import { uploadLogo } from '@/middleware/upload.middleware'

const r = Router()

r.get('/profile', verifyToken, requireRole('manager', 'superadmin'), ctrl.profileGet)
r.put('/profile', verifyToken, requireRole('manager', 'superadmin'), ctrl.profilePut)
r.post('/logo', verifyToken, requireRole('manager', 'superadmin'), uploadLogo, ctrl.logoUpload)
r.get('/settings', verifyToken, requireRole('manager', 'superadmin'), ctrl.settingsGet)
r.put('/settings', verifyToken, requireRole('manager', 'superadmin'), ctrl.settingsPut)

export default r
