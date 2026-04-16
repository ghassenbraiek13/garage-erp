import { Router } from 'express'
import * as ctrl from '@/controllers/superadmin.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { requireSuperadmin } from '@/middleware/rbac.middleware'

const r = Router()

r.use(verifyToken, requireSuperadmin())

r.get('/garages', ctrl.garagesList)
r.post('/garages', ctrl.garageCreate)
r.get('/garages/:id', ctrl.garageGet)
r.put('/garages/:id', ctrl.garageUpdate)
r.patch('/garages/:id/suspend', ctrl.garageSuspend)
r.patch('/garages/:id/activate', ctrl.garageActivate)
r.delete('/garages/:id', ctrl.garageDelete)

r.get('/users', ctrl.usersList)
r.get('/stats', ctrl.stats)
r.get('/activity', ctrl.activity)
r.get('/subscriptions', ctrl.subscriptionsList)
r.patch('/subscriptions/:garageId', ctrl.subscriptionPatch)

export default r
