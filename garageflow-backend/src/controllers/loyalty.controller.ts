import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Client } from '@/models/Client.model'
import { Coupon } from '@/models/Coupon.model'
import { Quote } from '@/models/Quote.model'
import { ok, fail } from '@/utils/apiResponse'
import { assertGarage } from '@/utils/garageScope'

export async function getLoyaltyInfo(req: Request, res: Response): Promise<void> {
  const clientId = req.user?.clientId
  if (!clientId) {
    res.status(403).json(fail('Client account required'))
    return
  }

  const client = await Client.findById(clientId).lean()
  if (!client) {
    res.status(404).json(fail('Client not found'))
    return
  }

  const now = new Date()
  const coupons = await Coupon.find({
    garageId: client.garageId,
    isUsed: false,
    isActive: true,
    $and: [
      { $or: [{ clientId: null }, { clientId: client._id }] },
      { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }] },
    ],
  })
    .sort({ expiresAt: 1 })
    .lean()

  res.json(
    ok({
      points: client.loyaltyPoints,
      tier: client.loyaltyTier,
      totalSpent: client.totalSpent,
      history: client.historiquePoints ?? [],
      coupons,
    }),
  )
}

export async function applyCoupon(req: Request, res: Response): Promise<void> {
  const clientId = req.user?.clientId
  if (!clientId) {
    res.status(403).json(fail('Client account required'))
    return
  }

  const { couponCode, quoteId } = req.body as { couponCode: string; quoteId: string }
  const client = await Client.findById(clientId)
  if (!client) {
    res.status(404).json(fail('Client not found'))
    return
  }

  const now = new Date()
  const coupon = await Coupon.findOne({
    garageId: client.garageId,
    code: couponCode.toUpperCase().trim(),
    isUsed: false,
    isActive: true,
    $or: [{ clientId: null }, { clientId: client._id }],
  })

  if (!coupon || (coupon.expiresAt && coupon.expiresAt < now)) {
    res.status(400).json(fail('Coupon invalide ou expiré'))
    return
  }

  const quote = await Quote.findOne({
    _id: quoteId,
    garageId: client.garageId,
    clientId: client._id,
  })

  if (!quote) {
    res.status(404).json(fail('Quote not found'))
    return
  }

  const before = quote.totalTTC
  let remiseAppliquee = 0

  if (coupon.type === 'percentage' && coupon.value != null) {
    remiseAppliquee = Math.round((before * coupon.value) / 100 * 100) / 100
    quote.totalTTC = Math.max(0, Math.round((before - remiseAppliquee) * 100) / 100)
  } else if (coupon.type === 'fixed' && coupon.value != null) {
    remiseAppliquee = Math.min(coupon.value, before)
    quote.totalTTC = Math.max(0, Math.round((before - remiseAppliquee) * 100) / 100)
  } else if (coupon.type === 'free_service') {
    remiseAppliquee = before
    quote.totalTTC = 0
  }

  await quote.save()

  coupon.isUsed = true
  coupon.usedAt = new Date()
  coupon.usedOnQuoteId = new mongoose.Types.ObjectId(quoteId)
  coupon.usedCount += 1
  await coupon.save()

  res.json(
    ok({
      nouveauTotalTTC: quote.totalTTC,
      remiseAppliquee,
    }),
  )
}

/** Manager/cashier: loyalty overview for garage */
export async function getGarageLoyaltyStats(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const clients = await Client.find({ garageId }).lean()
  const coupons = await Coupon.find({ garageId }).lean()

  const totalPoints = clients.reduce((s, c) => s + (c.loyaltyPoints ?? 0), 0)
  const activeCoupons = coupons.filter((c) => c.isActive && !c.isUsed).length
  const usedCoupons = coupons.filter((c) => c.isUsed).length

  res.json(
    ok({
      totalClients: clients.length,
      totalPoints,
      activeCoupons,
      usedCoupons,
      clients: clients
        .sort((a, b) => (b.loyaltyPoints ?? 0) - (a.loyaltyPoints ?? 0))
        .map((c) => ({
          id: String(c._id),
          name: c.name,
          loyaltyPoints: c.loyaltyPoints,
          loyaltyTier: c.loyaltyTier,
          totalSpent: c.totalSpent,
        })),
    }),
  )
}
