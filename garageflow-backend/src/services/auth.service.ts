import jwt, { type SignOptions } from 'jsonwebtoken'
import argon2 from 'argon2'
import mongoose from 'mongoose'
import { getEnv } from '@/config/env'
import { User, type IUser } from '@/models/User.model'
import { randomOtp6 } from '@/utils/generateCode'
import type { JwtPayload } from '@/types/express'

const ARGON_OTP = { memoryCost: 65536, timeCost: 3, parallelism: 4 } as const

export function signAccessToken(payload: JwtPayload): string {
  const env = getEnv()
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  } as SignOptions)
}

export function signRefreshToken(payload: { sub: string }): string {
  const env = getEnv()
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  } as SignOptions)
}

export function verifyRefreshToken(token: string): { sub: string } {
  const env = getEnv()
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string }
}

export function toUserDto(user: IUser & { _id: mongoose.Types.ObjectId }) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    garageId: user.garageId ? user.garageId.toString() : null,
    clientId: user.clientId ? user.clientId.toString() : null,
    avatar: user.avatar,
  }
}

export async function addRefreshToken(userId: mongoose.Types.ObjectId, token: string): Promise<void> {
  const user = await User.findById(userId).select('refreshTokens')
  if (!user) return
  const list = [...(user.refreshTokens ?? [])]
  list.push({ token, createdAt: new Date() })
  while (list.length > 5) list.shift()
  await User.updateOne({ _id: userId }, { refreshTokens: list })
}

export async function removeRefreshToken(userId: mongoose.Types.ObjectId, token: string): Promise<void> {
  await User.updateOne(
    { _id: userId },
    { $pull: { refreshTokens: { token } } },
  )
}

export async function hashOtp(otp: string): Promise<string> {
  return argon2.hash(otp, ARGON_OTP)
}

export async function verifyOtp(hash: string, otp: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, otp)
  } catch {
    return false
  }
}

export function generateOtp(): string {
  return randomOtp6()
}
