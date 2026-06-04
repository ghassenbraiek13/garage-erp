import { Router } from 'express'
import * as ctrl from '@/controllers/quote.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'
import { validateBody } from '@/middleware/validate.middleware'
import {
  ApplyCouponToQuoteSchema,
  CreateQuoteSchema,
  QuoteStatusSchema,
  UpdateQuoteSchema,
} from '@/schemas/quote.schema'

const r = Router()

r.get('/portal/my', verifyToken, requireRole('client'), ctrl.listForClient)
r.patch('/portal/:id/accept', verifyToken, requireRole('client'), ctrl.acceptQuote)
r.patch('/portal/:id/refuse', verifyToken, requireRole('client'), ctrl.refuseQuote)
r.post(
  '/portal/:id/apply-coupon',
  verifyToken,
  requireRole('client'),
  validateBody(ApplyCouponToQuoteSchema),
  ctrl.applyCouponToQuote,
)

r.get('/', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.list)
r.get('/:id/pdf', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.pdf)
r.post('/:id/send-email', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.sendEmail)
r.post('/:id/convert', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.convert)
r.get('/:id', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.getOne)
r.post('/', verifyToken, requireRole('manager', 'cashier', 'superadmin'), validateBody(CreateQuoteSchema), ctrl.create)
r.put(
  '/:id',
  verifyToken,
  requireRole('manager', 'cashier', 'superadmin'),
  validateBody(UpdateQuoteSchema),
  ctrl.update,
)
r.patch(
  '/:id/status',
  verifyToken,
  requireRole('manager', 'cashier', 'superadmin'),
  validateBody(QuoteStatusSchema),
  ctrl.patchStatus,
)
r.delete('/:id', verifyToken, requireRole('manager', 'superadmin'), ctrl.remove)

export default r
