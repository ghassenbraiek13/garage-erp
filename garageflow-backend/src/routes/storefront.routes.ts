import { Router } from 'express'
import * as ctrl from '@/controllers/storefront.controller'

const r = Router()

r.get('/parts', ctrl.partsList)
r.get('/parts/:id', ctrl.partGet)
r.get('/services', ctrl.servicesList)

export default r
