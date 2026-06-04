import { Router } from 'express'
import * as ctrl from '@/controllers/loyalty.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'
import { validateBody } from '@/middleware/validate.middleware'
import { ApplyCouponSchema } from '@/schemas/loyalty.schema'

const r = Router()

r.get('/my', verifyToken, requireRole('client'), ctrl.getLoyaltyInfo)
r.post(
  '/apply-coupon',
  verifyToken,
  requireRole('client'),
  validateBody(ApplyCouponSchema),
  ctrl.applyCoupon,
)
r.get('/stats', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.getGarageLoyaltyStats)

export default r
