import { Router } from 'express'
import * as ctrl from '@/controllers/dashboard.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'

const r = Router()

r.get('/stats', verifyToken, requireRole('manager', 'mechanic', 'cashier', 'superadmin'), ctrl.stats)

export default r
