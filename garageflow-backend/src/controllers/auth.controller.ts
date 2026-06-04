import type { Request, Response } from 'express'
import argon2 from 'argon2'
import mongoose from 'mongoose'
import path from 'path'
import sharp from 'sharp'
import { getEnv } from '@/config/env'
import { Garage } from '@/models/Garage.model'
import { User } from '@/models/User.model'
import { ok } from '@/utils/apiResponse'
import {
  addRefreshToken,
  generateOtp,
  hashOtp,
  removeRefreshToken,
  signAccessToken,
  signRefreshToken,
  toUserDto,
  verifyOtp,
  verifyRefreshToken,
} from '@/services/auth.service'
import { sendPasswordResetEmail } from '@/services/email.service'
import type { JwtPayload } from '@/types/express'

const COOKIE = 'refreshToken'

function cookieOpts() {
  const env = getEnv()
  const prod = env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    sameSite: prod ? ('strict' as const) : ('lax' as const),
    secure: prod,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  }
}

function buildPayload(user: {
  _id: mongoose.Types.ObjectId
  email: string
  role: string
  garageId?: mongoose.Types.ObjectId | null
  clientId?: mongoose.Types.ObjectId | null
}): JwtPayload {
  return {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    garageId: user.garageId ? user.garageId.toString() : null,
    clientId: user.clientId ? user.clientId.toString() : null,
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password, role } = req.body as { email: string; password: string; role?: string }
  const user = await User.findByEmail(email)
  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid credentials' })
    return
  }
  if (!(await user.comparePassword(password))) {
    res.status(401).json({ success: false, message: 'Invalid credentials' })
    return
  }
  if (!user.isActive) {
    res.status(403).json({ success: false, message: 'Account disabled' })
    return
  }
  if (role && user.role !== role && user.role !== 'superadmin') {
    res.status(403).json({ success: false, message: 'Role mismatch' })
    return
  }
  const payload = buildPayload(user)
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken({ sub: user._id.toString() })
  await addRefreshToken(user._id, refreshToken)
  await User.updateOne({ _id: user._id }, { lastLogin: new Date() })
  res.cookie(COOKIE, refreshToken, cookieOpts())
  res.json(ok({ user: toUserDto(user), accessToken }))
}

export async function register(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    garageName: string
    garageAddress: { street: string; city: string; postalCode: string }
    name: string
    email: string
    password: string
  }
  const garage = await Garage.create({
    name: body.garageName,
    address: {
      street: body.garageAddress.street,
      city: body.garageAddress.city,
      postalCode: body.garageAddress.postalCode,
    },
    subscriptionTier: 'trial',
    subscriptionStatus: 'active',
  })
  const user = await User.create({
    email: body.email,
    password: body.password,
    name: body.name,
    role: 'manager',
    garageId: garage._id,
  })
  const payload = buildPayload(user)
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken({ sub: user._id.toString() })
  await addRefreshToken(user._id, refreshToken)
  res.cookie(COOKIE, refreshToken, cookieOpts())
  res.status(201).json(ok({ user: toUserDto(user), accessToken }))
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[COOKIE] as string | undefined
  if (!token) {
    res.status(401).json({ success: false, message: 'No refresh token' })
    return
  }
  let decoded: { sub: string }
  try {
    decoded = verifyRefreshToken(token)
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token', code: 'INVALID_TOKEN' })
    return
  }
  const user = await User.findById(decoded.sub).select('+refreshTokens')
  if (!user?.refreshTokens?.some((x) => x.token === token)) {
    res.status(401).json({ success: false, message: 'Invalid refresh token', code: 'INVALID_TOKEN' })
    return
  }
  await removeRefreshToken(user._id, token)
  const payload = buildPayload(user)
  const accessToken = signAccessToken(payload)
  const newRefresh = signRefreshToken({ sub: user._id.toString() })
  await addRefreshToken(user._id, newRefresh)
  res.cookie(COOKIE, newRefresh, cookieOpts())
  res.json(ok({ accessToken }))
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[COOKIE] as string | undefined
  if (token) {
    try {
      const d = verifyRefreshToken(token)
      const user = await User.findById(d.sub).select('+refreshTokens')
      if (user) await removeRefreshToken(user._id, token)
    } catch {
      /* ignore */
    }
  }
  res.clearCookie(COOKIE, { path: '/' })
  res.json(ok({ loggedOut: true }))
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string }
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+passwordResetOtpHash +passwordResetOtpExpires',
  )
  if (user) {
    const otp = generateOtp()
    const hash = await hashOtp(otp)
    const expires = new Date(Date.now() + 15 * 60 * 1000)
    await User.updateOne(
      { _id: user._id },
      { passwordResetOtpHash: hash, passwordResetOtpExpires: expires },
    )
    try {
      await sendPasswordResetEmail(user.email, otp)
    } catch (emailErr) {
      console.error('[password reset email error]', emailErr)
    }
  }
  res.json(ok({ sent: true }))
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, otp, newPassword } = req.body as { email: string; otp: string; newPassword: string }
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+passwordResetOtpHash +passwordResetOtpExpires +password',
  )
  if (!user?.passwordResetOtpHash || !user.passwordResetOtpExpires || user.passwordResetOtpExpires < new Date()) {
    res.status(400).json({ success: false, message: 'Invalid or expired OTP' })
    return
  }
  if (!(await verifyOtp(user.passwordResetOtpHash, otp))) {
    res.status(400).json({ success: false, message: 'Invalid OTP' })
    return
  }
  user.password = newPassword
  user.passwordResetOtpHash = undefined
  user.passwordResetOtpExpires = undefined
  user.refreshTokens = []
  await user.save()
  res.json(ok({ reset: true }))
}

export async function me(req: Request, res: Response): Promise<void> {
  const sub = req.user?.sub
  if (!sub) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }
  const user = await User.findById(sub).populate('garageId')
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' })
    return
  }
  const json = user.toJSON() as Record<string, unknown>
  if (json.garageId && typeof json.garageId === 'object' && json.garageId !== null) {
    json.garage = json.garageId
    const g = json.garageId as { id?: string; _id?: { toString: () => string } }
    json.garageId = g.id ?? g._id?.toString() ?? null
  }
  res.json(ok({ user: json }))
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const sub = req.user?.sub
  if (!sub) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }
  const { name, email } = req.body as { name?: string; email?: string }
  await User.updateOne({ _id: sub }, { ...(name ? { name } : {}), ...(email ? { email: email.toLowerCase() } : {}) })
  const user = await User.findById(sub)
  res.json(ok({ user: user?.toJSON() }))
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const sub = req.user?.sub
  if (!sub) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string }
  const user = await User.findById(sub).select('+password')
  if (!user || !(await user.comparePassword(currentPassword))) {
    res.status(400).json({ success: false, message: 'Current password invalid' })
    return
  }
  user.password = newPassword
  user.refreshTokens = []
  await user.save()
  res.json(ok({ updated: true }))
}

export async function uploadAvatar(req: Request, res: Response): Promise<void> {
  const sub = req.user?.sub
  const target = req.params.id
  if (!sub) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }
  const meUser = await User.findById(sub)
  if (!meUser) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  if (meUser.role !== 'manager' && meUser._id.toString() !== target) {
    res.status(403).json({ success: false, message: 'Forbidden' })
    return
  }
  const file = req.file
  if (!file) {
    res.status(400).json({ success: false, message: 'No file' })
    return
  }
  const fs = await import('fs/promises')
  const full = file.path
  const buf = await sharp(full).resize(256, 256, { fit: 'cover' }).toBuffer()
  await fs.writeFile(full, buf)
  const rel = path.posix.join('avatars', file.filename)
  await User.updateOne({ _id: target }, { avatar: rel })
  res.json(ok({ avatar: rel }))
}
