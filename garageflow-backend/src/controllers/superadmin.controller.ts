import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { Garage, type IGarage } from '@/models/Garage.model'
import { User } from '@/models/User.model'
import { Invoice } from '@/models/Invoice.model'
import { Repair } from '@/models/Repair.model'
import { Subscription } from '@/models/Subscription.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'

const GaragePaged = Garage as unknown as PaginateModel<IGarage>

export async function garagesList(req: Request, res: Response): Promise<void> {
  const { page, limit, sort, order, search } = parsePagination(req.query as Record<string, unknown>)
  const filter: Record<string, unknown> = {}
  if (search) filter.name = new RegExp(search, 'i')
  const result = await GaragePaged.paginate(filter, { page, limit, sort: { [sort]: order } })
  res.json(ok(result.docs, buildMeta(result.totalDocs, page, limit)))
}

export async function garageGet(req: Request, res: Response): Promise<void> {
  const g = await Garage.findById(req.params.id)
  if (!g) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(g.toJSON()))
}

export async function garageCreate(req: Request, res: Response): Promise<void> {
  const g = await Garage.create(req.body)
  res.status(201).json(ok(g.toJSON()))
}

export async function garageUpdate(req: Request, res: Response): Promise<void> {
  const g = await Garage.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!g) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(g.toJSON()))
}

export async function garageSuspend(req: Request, res: Response): Promise<void> {
  await Garage.updateOne(
    { _id: req.params.id },
    { subscriptionStatus: 'suspended', subscriptionTier: 'trial' },
  )
  res.json(ok({ suspended: true }))
}

export async function garageActivate(req: Request, res: Response): Promise<void> {
  await Garage.updateOne({ _id: req.params.id }, { subscriptionStatus: 'active' })
  res.json(ok({ active: true }))
}

export async function garageDelete(req: Request, res: Response): Promise<void> {
  await Garage.deleteOne({ _id: req.params.id })
  res.json(ok({ deleted: true }))
}

export async function usersList(req: Request, res: Response): Promise<void> {
  const { page, limit } = parsePagination(req.query as Record<string, unknown>)
  const skip = (page - 1) * limit
  const [docs, total] = await Promise.all([
    User.find({}).select('-password -refreshTokens').skip(skip).limit(limit).lean(),
    User.countDocuments({}),
  ])
  res.json(ok(docs, buildMeta(total, page, limit)))
}

export async function stats(req: Request, res: Response): Promise<void> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const garages = await Garage.countDocuments({})
  const activeGarages = await Garage.countDocuments({ subscriptionStatus: 'active' })
  const suspendedGarages = await Garage.countDocuments({ subscriptionStatus: 'suspended' })
  const users = await User.countDocuments({})
  const revenueAgg = await Invoice.aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalTTC' } } },
  ])
  const monthlyRevenueAgg = await Invoice.aggregate([
    { $match: { status: 'paid', paidAt: { $gte: monthStart } } },
    { $group: { _id: null, total: { $sum: '$totalTTC' } } },
  ])
  const repairs = await Repair.countDocuments({})

  const tierDistribution = await Garage.aggregate([
    { $group: { _id: '$subscriptionTier', count: { $sum: 1 } } },
  ])

  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const topGaragesRevenue = await Invoice.aggregate([
    { $match: { status: 'paid', paidAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: '$garageId', revenue: { $sum: '$totalTTC' } } },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'garages',
        localField: '_id',
        foreignField: '_id',
        as: 'g',
      },
    },
    { $unwind: '$g' },
    { $project: { name: '$g.name', revenue: 1 } },
  ])

  const signupsByMonth: { month: string; count: number }[] = []
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    const c = await Garage.countDocuments({ createdAt: { $gte: d, $lte: end } })
    signupsByMonth.push({
      month: d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }),
      count: c,
    })
  }

  const subscriptionsActive = await Garage.countDocuments({ subscriptionStatus: 'active' })
  const subscriptionsExpired = await Garage.countDocuments({
    subscriptionExpiresAt: { $lt: now },
  })

  res.json(
    ok({
      garages,
      activeGarages,
      suspendedGarages,
      users,
      revenue: Math.round(revenueAgg[0]?.total ?? 0),
      monthlyRevenue: Math.round(monthlyRevenueAgg[0]?.total ?? 0),
      repairs,
      tierDistribution: tierDistribution.map((t) => ({ tier: t._id, count: t.count })),
      topGaragesRevenue,
      signupsByMonth,
      subscriptionsActive,
      subscriptionsExpired,
    }),
  )
}

export async function activity(_req: Request, res: Response): Promise<void> {
  const garages = await Garage.find().sort({ updatedAt: -1 }).limit(20).lean()
  const rows = garages.map((g) => {
    const created = g.createdAt && g.updatedAt && g.createdAt.getTime() === g.updatedAt.getTime()
    return {
      garage: g.name,
      action: created ? 'Nouveau garage' : g.subscriptionStatus === 'suspended' ? 'Statut / abonnement' : 'Mise à jour',
      date: g.updatedAt,
      status: g.subscriptionStatus,
    }
  })
  res.json(ok(rows))
}

export async function subscriptionsList(_req: Request, res: Response): Promise<void> {
  const list = await Garage.find({}).select('name subscriptionTier subscriptionStatus subscriptionExpiresAt').lean()
  res.json(ok(list))
}

export async function subscriptionPatch(req: Request, res: Response): Promise<void> {
  const { tier, expiresAt } = req.body as { tier: string; expiresAt?: string }
  const gid = req.params.garageId
  await Garage.updateOne(
    { _id: gid },
    {
      subscriptionTier: tier,
      subscriptionExpiresAt: expiresAt ? new Date(expiresAt) : undefined,
    },
  )
  await Subscription.create({
    garageId: new mongoose.Types.ObjectId(gid),
    tier: tier as IGarage['subscriptionTier'],
    status: 'active',
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  })
  res.json(ok({ updated: true }))
}
