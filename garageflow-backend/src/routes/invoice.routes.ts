import { Router } from 'express'
import * as ctrl from '@/controllers/invoice.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireRole } from '@/middleware/rbac.middleware'
import { validateBody } from '@/middleware/validate.middleware'
import { CreateInvoiceSchema, PayInvoiceSchema, UpdateInvoiceSchema } from '@/schemas/invoice.schema'

const r = Router()

r.get('/export/excel', verifyToken, requireRole('manager', 'superadmin'), ctrl.exportExcel)
r.get('/portal/my', verifyToken, requireRole('client'), ctrl.listForClient)
r.get('/', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.list)
r.get('/:id/pdf', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.pdf)
r.post('/:id/send-email', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.sendEmail)
r.post('/:id/send', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.sendEmail)
r.get('/:id', verifyToken, requireRole('manager', 'cashier', 'superadmin'), ctrl.getOne)
r.post('/', verifyToken, requireRole('manager', 'cashier', 'superadmin'), validateBody(CreateInvoiceSchema), ctrl.create)
r.put(
  '/:id',
  verifyToken,
  requireRole('manager', 'cashier', 'superadmin'),
  validateBody(UpdateInvoiceSchema),
  ctrl.update,
)
r.patch(
  '/:id/pay',
  verifyToken,
  requireRole('manager', 'cashier', 'superadmin'),
  validateBody(PayInvoiceSchema),
  ctrl.pay,
)
r.delete('/:id', verifyToken, requireRole('manager', 'superadmin'), ctrl.remove)

export default r
