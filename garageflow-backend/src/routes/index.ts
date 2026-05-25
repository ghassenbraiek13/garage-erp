import { Router } from 'express'
import authRoutes from './auth.routes'
import dashboardRoutes from './dashboard.routes'
import clientRoutes from './client.routes'
import vehicleRoutes from './vehicle.routes'
import repairRoutes from './repair.routes'
import serviceRoutes from './service.routes'
import diagnosticReportRoutes from './diagnosticReport.routes'
import quoteRoutes from './quote.routes'
import invoiceRoutes from './invoice.routes'
import partRoutes from './part.routes'
import taskRoutes from './task.routes'
import appointmentRoutes from './appointment.routes'
import couponRoutes from './coupon.routes'
import notificationRoutes from './notification.routes'
import userRoutes from './user.routes'
import garageRoutes from './garage.routes'
import superadminRoutes from './superadmin.routes'
import storefrontRoutes from './storefront.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/clients', clientRoutes)
router.use('/vehicles', vehicleRoutes)
router.use('/repairs', repairRoutes)
router.use('/services', serviceRoutes)
router.use('/diagnostic-reports', diagnosticReportRoutes)
router.use('/quotes', quoteRoutes)
router.use('/invoices', invoiceRoutes)
router.use('/parts', partRoutes)
router.use('/tasks', taskRoutes)
router.use('/appointments', appointmentRoutes)
router.use('/coupons', couponRoutes)
router.use('/notifications', notificationRoutes)
router.use('/users', userRoutes)
router.use('/garage', garageRoutes)
router.use('/superadmin', superadminRoutes)
router.use('/storefront', storefrontRoutes)

export default router
