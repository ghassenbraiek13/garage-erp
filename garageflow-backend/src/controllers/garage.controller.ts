import type { Request, Response } from 'express'
import path from 'path'
import sharp from 'sharp'
import fs from 'fs/promises'
import { Garage } from '@/models/Garage.model'
import { ok } from '@/utils/apiResponse'
import { assertGarage } from '@/utils/garageScope'

export async function profileGet(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const g = await Garage.findById(garageId)
  if (!g) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(g.toJSON()))
}

export async function profilePut(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const g = await Garage.findByIdAndUpdate(garageId, req.body, { new: true })
  res.json(ok(g!.toJSON()))
}

export async function logoUpload(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const file = req.file
  if (!file) {
    res.status(400).json({ success: false, message: 'No file' })
    return
  }
  const full = file.path
  const buf = await sharp(full).resize(512, 512, { fit: 'inside' }).toBuffer()
  await fs.writeFile(full, buf)
  const rel = path.posix.join('logos', file.filename)
  await Garage.updateOne({ _id: garageId }, { logo: rel })
  res.json(ok({ logo: rel }))
}

export async function settingsGet(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const g = await Garage.findById(garageId).select('settings subscriptionTier subscriptionStatus')
  res.json(ok(g?.settings))
}

export async function settingsPut(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const g = await Garage.findByIdAndUpdate(garageId, { settings: req.body }, { new: true })
  res.json(ok(g!.settings))
}
