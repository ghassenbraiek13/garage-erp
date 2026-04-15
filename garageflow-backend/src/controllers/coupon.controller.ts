import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { Coupon, type ICoupon } from '@/models/Coupon.model'
import { Invoice } from '@/models/Invoice.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { qrToBase64 } from '@/services/qr.service'

const CouponPaged = Coupon as unknown as PaginateModel<ICoupon>

export async function list(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { page, limit, sort, order } = parsePagination(req.query as Record<string, unknown>)
  const result = await CouponPaged.paginate({ garageId }, { page, limit, sort: { [sort]: order } })
  res.json(ok(result.docs, buildMeta(result.totalDocs, page, limit)))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const c = await Coupon.findOne({ _id: req.params.id, garageId })
  if (!c) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(c.toJSON()))
}

export async function create(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const body = req.body as Record<string, unknown>
  const code = (body.code as string | undefined)?.toUpperCase() ?? `GF-${Date.now().toString(36).toUpperCase()}`
  const qrCode = await qrToBase64(`${code}:${garageId.toString()}`)
  const c = await Coupon.create({
    garageId,
    code,
    type: body.type,
    value: body.value as number | undefined,
    minSpend: (body.minSpend as number) ?? 0,
    maxUses: body.maxUses === null ? null : (body.maxUses as number | undefined) ?? null,
    clientId: body.clientId ? new mongoose.Types.ObjectId(String(body.clientId)) : null,
    expiresAt: body.expiresAt ? new Date(String(body.expiresAt)) : undefined,
    isActive: body.isActive !== false,
    qrCode,
  })
  res.status(201).json(ok(c.toJSON()))
}

export async function update(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const body = req.body as Record<string, unknown>
  const payload = { ...body } as Record<string, unknown>
  if (body.expiresAt) payload.expiresAt = new Date(String(body.expiresAt))
  const c = await Coupon.findOneAndUpdate({ _id: req.params.id, garageId }, payload, { new: true })
  if (!c) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(c.toJSON()))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  await Coupon.deleteOne({ _id: req.params.id, garageId })
  res.json(ok({ deleted: true }))
}

export async function validateCoupon(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { code, amount } = req.body as { code: string; amount: number }
  const c = await Coupon.findOne({ garageId, code: code.toUpperCase() })
  if (!c?.isActive) {
    res.json(ok({ valid: false, discount: 0 }))
    return
  }
  if (c.expiresAt && c.expiresAt < new Date()) {
    res.json(ok({ valid: false, discount: 0 }))
    return
  }
  if (c.maxUses !== null && c.usedCount >= (c.maxUses ?? 0)) {
    res.json(ok({ valid: false, discount: 0 }))
    return
  }
  if (amount < c.minSpend) {
    res.json(ok({ valid: false, discount: 0, message: 'Montant minimum non atteint' }))
    return
  }
  let discount = 0
  if (c.type === 'percentage' && c.value != null) {
    discount = Math.round((amount * c.value) / 100 * 100) / 100
  } else if (c.type === 'fixed' && c.value != null) {
    discount = Math.min(c.value, amount)
  } else if (c.type === 'free_service') {
    discount = amount
  }
  res.json(ok({ valid: true, discount, couponId: c._id.toString() }))
}

export async function redeem(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { code, invoiceId } = req.body as { code: string; invoiceId: string }
  const c = await Coupon.findOne({ garageId, code: code.toUpperCase() })
  if (!c?.isActive) {
    res.status(400).json({ success: false, message: 'Invalid coupon' })
    return
  }
  if (c.maxUses !== null && c.usedCount >= (c.maxUses ?? 0)) {
    res.status(400).json({ success: false, message: 'Coupon exhausted' })
    return
  }
  c.usedCount += 1
  await c.save()
  await Invoice.updateOne({ _id: invoiceId, garageId }, { $set: { notes: `Coupon ${code}` } })
  res.json(ok({ redeemed: true }))
}
