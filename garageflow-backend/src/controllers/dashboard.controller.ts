import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Client } from '@/models/Client.model'
import { Repair } from '@/models/Repair.model'
import { Quote } from '@/models/Quote.model'
import { Invoice } from '@/models/Invoice.model'
import { Appointment } from '@/models/Appointment.model'
import { Part } from '@/models/Part.model'
import { ok } from '@/utils/apiResponse'
import { assertGarage } from '@/utils/garageScope'

function monthBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export async function stats(req: Request, res: Response): Promise<void> {
  const gid =
    req.user?.role === 'superadmin' && req.query.garageId && mongoose.isValidObjectId(String(req.query.garageId))
      ? new mongoose.Types.ObjectId(String(req.query.garageId))
      : assertGarage(req)

  const now = new Date()
  const { start: thisMonthStart } = monthBounds(now)
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const { start: lastMonthStart, end: lastMonthEnd } = monthBounds(lastMonthDate)

  const clientTotal = await Client.countDocuments({ garageId: gid })
  const clientsThisMonth = await Client.countDocuments({ garageId: gid, createdAt: { $gte: thisMonthStart } })
  const clientsLastMonth = await Client.countDocuments({
    garageId: gid,
    createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
  })
  const growth =
    clientsLastMonth === 0 ? 100 : Math.round(((clientsThisMonth - clientsLastMonth) / clientsLastMonth) * 100)

  const repairsInProgress = await Repair.countDocuments({ garageId: gid, status: { $in: ['in_progress', 'waiting_parts'] } })
  const completedThisMonth = await Repair.countDocuments({
    garageId: gid,
    status: 'completed',
    completedAt: { $gte: thisMonthStart },
  })

  const revenueAgg = await Invoice.aggregate([
    { $match: { garageId: gid, status: 'paid', paidAt: { $exists: true } } },
    {
      $facet: {
        thisMonth: [
          { $match: { paidAt: { $gte: thisMonthStart } } },
          { $group: { _id: null, total: { $sum: '$totalTTC' } } },
        ],
        lastMonth: [
          { $match: { paidAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
          { $group: { _id: null, total: { $sum: '$totalTTC' } } },
        ],
      },
    },
  ])
  const thisRev = revenueAgg[0]?.thisMonth[0]?.total ?? 0
  const lastRev = revenueAgg[0]?.lastMonth[0]?.total ?? 0
  const revGrowth = lastRev === 0 ? 0 : Math.round(((thisRev - lastRev) / lastRev) * 100)

  const quotesPending = await Quote.countDocuments({
    garageId: gid,
    status: { $in: ['draft', 'sent'] },
  })
  const quotesTotal = await Quote.countDocuments({ garageId: gid })

  const months: { month: string; revenue: number }[] = []
  for (let i = 11; i >= 0; i -= 1) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const { start, end } = monthBounds(dt)
    const label = dt.toLocaleString('fr-FR', { month: 'short' })
    const r = await Invoice.aggregate([
      {
        $match: {
          garageId: gid,
          status: 'paid',
          paidAt: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalTTC' } } },
    ])
    months.push({ month: label, revenue: Math.round(r[0]?.total ?? 0) })
  }

  const upcomingAppointments = await Appointment.find({ garageId: gid, start: { $gte: now } })
    .sort({ start: 1 })
    .limit(5)
    .populate('clientId')
    .populate('vehicleId')
    .populate('serviceId')
    .lean()

  const recentRepairs = await Repair.find({ garageId: gid })
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate('clientId')
    .populate('vehicleId')
    .populate('mechanicId')
    .lean()

  const lowStockParts = await Part.find({ garageId: gid, $expr: { $lt: ['$stock', '$minStock'] } })
    .limit(5)
    .lean()

  res.json(
    ok({
      clients: { total: clientTotal, thisMonth: clientsThisMonth, growth },
      repairs: { inProgress: repairsInProgress, completedThisMonth },
      revenue: { thisMonth: Math.round(thisRev), lastMonth: Math.round(lastRev), growth: revGrowth },
      quotes: { pending: quotesPending, total: quotesTotal },
      revenueChart: months,
      upcomingAppointments,
      recentRepairs,
      lowStockParts,
    }),
  )
}
