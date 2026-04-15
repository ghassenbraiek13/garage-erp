import { Router } from 'express'
import * as ctrl from '@/controllers/coupon.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'
import { validateBody } from '@/middleware/validate.middleware'
import { CreateCouponSchema, RedeemCouponSchema, UpdateCouponSchema, ValidateCouponSchema } from '@/schemas/coupon.schema'

const r = Router()

r.post('/validate', verifyToken, requireRole('cashier', 'manager', 'superadmin'), validateBody(ValidateCouponSchema), ctrl.validateCoupon)
r.post('/redeem', verifyToken, requireRole('cashier', 'manager', 'superadmin'), validateBody(RedeemCouponSchema), ctrl.redeem)
r.get('/', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.list)
r.get('/:id', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.getOne)
r.post('/', verifyToken, requireRole('manager', 'superadmin'), validateBody(CreateCouponSchema), ctrl.create)
r.put('/:id', verifyToken, requireRole('manager', 'superadmin'), validateBody(UpdateCouponSchema), ctrl.update)
r.delete('/:id', verifyToken, requireRole('manager', 'superadmin'), ctrl.remove)

export default r
