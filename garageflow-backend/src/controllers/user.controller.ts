import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { User } from '@/models/User.model'
import { ok } from '@/utils/apiResponse'
import { assertGarage } from '@/utils/garageScope'

export async function list(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const users = await User.find({ garageId }).select('-password -refreshTokens')
  res.json(ok(users.map((u) => u.toJSON())))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const u = await User.findOne({ _id: req.params.id, garageId }).select('-password -refreshTokens')
  if (!u) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(u.toJSON()))
}

export async function create(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { email, password, name, role } = req.body as {
    email: string
    password: string
    name: string
    role: 'mechanic' | 'cashier'
  }
  const u = await User.create({ email, password, name, role, garageId })
  res.status(201).json(ok(u.toJSON()))
}

export async function update(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const u = await User.findOneAndUpdate({ _id: req.params.id, garageId }, req.body, { new: true }).select(
    '-password -refreshTokens',
  )
  if (!u) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(u.toJSON()))
}

export async function patchActive(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { isActive } = req.body as { isActive: boolean }
  const u = await User.findOneAndUpdate({ _id: req.params.id, garageId }, { isActive }, { new: true })
  if (!u) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(u.toJSON()))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  await User.deleteOne({ _id: req.params.id, garageId })
  res.json(ok({ deleted: true }))
}

export async function mechanics(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const m = await User.find({ garageId, role: 'mechanic', isActive: true }).select('name email')
  res.json(ok(m.map((x) => x.toJSON())))
}
