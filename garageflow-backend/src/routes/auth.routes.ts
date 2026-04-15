import { Router } from 'express'
import * as ctrl from '@/controllers/auth.controller'
import { verifyToken } from '@/middleware/auth.middleware'
import { validateBody } from '@/middleware/validate.middleware'
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  UpdateMeSchema,
} from '@/schemas/auth.schema'
const r = Router()

r.post('/login', validateBody(LoginSchema), ctrl.login)
r.post('/register', validateBody(RegisterSchema), ctrl.register)
r.post('/refresh', ctrl.refresh)
r.post('/logout', ctrl.logout)
r.post('/forgot-password', validateBody(ForgotPasswordSchema), ctrl.forgotPassword)
r.post('/reset-password', validateBody(ResetPasswordSchema), ctrl.resetPassword)
r.get('/me', verifyToken, ctrl.me)
r.put('/me', verifyToken, validateBody(UpdateMeSchema), ctrl.updateMe)
r.put('/change-password', verifyToken, validateBody(ChangePasswordSchema), ctrl.changePassword)

export default r
