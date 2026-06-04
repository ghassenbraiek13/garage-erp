import type { Request, Response } from 'express'
import mongoose, { Types } from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { Quote, type IQuote, type IQuoteLine } from '@/models/Quote.model'
import { Invoice } from '@/models/Invoice.model'
import { ok, fail } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { generateQuotePDF } from '@/services/pdf.service'
import { sendPdfAttachment } from '@/services/email.service'
import { Client } from '@/models/Client.model'
import { Coupon } from '@/models/Coupon.model'
import { Garage } from '@/models/Garage.model'
import { User } from '@/models/User.model'
import { getSocketServer } from '@/sockets/emitter'
import { notifyManagers } from '@/services/notification.service'
import { logger } from '@/config/logger'

const QuotePaged = Quote as unknown as PaginateModel<IQuote>

function mapLines(lines: unknown[]): IQuoteLine[] {
  return (lines as Array<Record<string, unknown>>).map((l) => ({
    type: l.type as 'service' | 'part',
    refId: l.refId ? new mongoose.Types.ObjectId(String(l.refId)) : undefined,
    label: String(l.label),
    quantity: Number(l.quantity),
    unitPrice: Number(l.unitPrice),
    discount: l.discount !== undefined ? Number(l.discount) : 0,
    tva: l.tva !== undefined ? Number(l.tva) : 20,
    totalHT: 0,
    totalTTC: 0,
  }))
}

export async function list(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { page, limit, sort, order } = parsePagination(req.query as Record<string, unknown>)
  const search = req.query.search as string | undefined
  const status = req.query.status as string | undefined

  let clientIds: Types.ObjectId[] | undefined

  if (search) {
    const matchingClients = await Client.find({
      garageId,
      $or: [
        { nom: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { telephone: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ],
    })
      .select('_id')
      .lean()

    clientIds = matchingClients.map((c) => c._id as Types.ObjectId)
  }

  const query: Record<string, unknown> = { garageId }

  if (search) {
    query.$or = [
      { number: { $regex: search, $options: 'i' } },
      ...(clientIds && clientIds.length > 0 ? [{ clientId: { $in: clientIds } }] : []),
    ]
  }

  if (status) query.status = status

  const result = await QuotePaged.paginate(query, { page, limit, sort: { [sort]: order } })
  res.json(ok(result.docs, buildMeta(result.totalDocs, page, limit)))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const q = await Quote.findOne({ _id: req.params.id, garageId })
  if (!q) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(q.toJSON()))
}

export async function create(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const body = req.body as Record<string, unknown>
  const lines = mapLines(body.lines as unknown[])
  const q = await Quote.create({
    ...body,
    garageId,
    clientId: new mongoose.Types.ObjectId(String(body.clientId)),
    vehicleId: body.vehicleId ? new mongoose.Types.ObjectId(String(body.vehicleId)) : undefined,
    validUntil: body.validUntil ? new Date(String(body.validUntil)) : undefined,
    lines,
  })
  res.status(201).json(ok(q.toJSON()))
}

export async function update(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const existing = await Quote.findOne({ _id: req.params.id, garageId })
  if (!existing) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  if (!['draft', 'sent'].includes(existing.status)) {
    res.status(400).json({ success: false, message: 'Quote locked' })
    return
  }
  const body = req.body as Record<string, unknown>
  const payload = { ...body } as Record<string, unknown>
  if (body.lines) payload.lines = mapLines(body.lines as unknown[])
  if (body.clientId) payload.clientId = new mongoose.Types.ObjectId(String(body.clientId))
  if (body.vehicleId) payload.vehicleId = new mongoose.Types.ObjectId(String(body.vehicleId))
  const q = await Quote.findOneAndUpdate({ _id: existing._id, garageId }, payload, { new: true })
  res.json(ok(q!.toJSON()))
}

export async function patchStatus(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { status } = req.body as { status: string }
  const q = await Quote.findOneAndUpdate({ _id: req.params.id, garageId }, { status }, { new: true })
  if (!q) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(q.toJSON()))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const q = await Quote.findOne({ _id: req.params.id, garageId })
  if (!q) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  if (q.status !== 'draft') {
    res.status(400).json({ success: false, message: 'Only draft deletable' })
    return
  }
  await q.deleteOne()
  res.json(ok({ deleted: true }))
}

export async function convert(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const q = await Quote.findOne({ _id: req.params.id, garageId })
  if (!q) {
    res.status(404).json(fail('Devis introuvable'))
    return
  }
  if (q.status === 'invoiced') {
    res.status(409).json(fail('Ce devis a déjà été transformé en facture'))
    return
  }
  const inv = await Invoice.create({
    garageId,
    clientId: q.clientId,
    vehicleId: q.vehicleId,
    quoteId: q._id,
    lines: q.lines.map((l) => ({ ...l, refId: l.refId })),
    status: 'unpaid',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })
  q.status = 'invoiced'
  await q.save()
  res.status(201).json(ok(inv.toJSON()))
}

export async function pdf(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const q = await Quote.findOne({ _id: req.params.id, garageId })
  if (!q) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  const [g, c] = await Promise.all([Garage.findById(garageId), Client.findById(q.clientId)])
  const buf = await generateQuotePDF({ ...q.toObject(), garage: g ?? undefined, client: c ?? undefined })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${q.number}.pdf"`)
  res.send(buf)
}

export async function sendEmail(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const q = await Quote.findOne({ _id: req.params.id, garageId })
  if (!q) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  const c = await Client.findById(q.clientId)
  const g = await Garage.findById(garageId)
  if (!c?.email) {
    res.status(400).json({ success: false, message: 'Client has no email' })
    return
  }
  const buf = await generateQuotePDF({ ...q.toObject(), garage: g ?? undefined, client: c ?? undefined })
  await sendPdfAttachment(c.email, `Devis ${q.number} - GarageFlow`, `${q.number}.pdf`, buf)
  q.status = 'sent'
  q.sentAt = new Date()
  await q.save()

  try {
    const portalUser = await User.findOne({
      clientId: q.clientId,
      role: 'client',
      isActive: true,
    })
      .select('_id')
      .lean()

    if (portalUser?._id) {
      const { Notification } = await import('@/models/Notification.model')
      await Notification.create({
        garageId: q.garageId,
        userId: portalUser._id,
        type: 'quote_accepted',
        title: 'Nouveau devis disponible',
        message: `Votre devis ${q.number} d'un montant de ${q.totalTTC} TND est disponible. Consultez-le et acceptez ou refusez-le.`,
        link: '/portal/quotes',
        isRead: false,
      })

      const io = getSocketServer()
      if (io) {
        io.to(`client:${String(q.clientId)}`).emit('quote:new', {
          title: 'Nouveau devis disponible 📋',
          message: `Devis ${q.number} — ${q.totalTTC} TND`,
          quoteId: String(q._id),
          number: q.number,
          link: '/portal/quotes',
        })
        io.to(`user:${String(portalUser._id)}`).emit('quote:new', {
          title: 'Nouveau devis disponible 📋',
          message: `Devis ${q.number} — ${q.totalTTC} TND`,
          quoteId: String(q._id),
          number: q.number,
          link: '/portal/quotes',
        })
      }
    }
  } catch (err) {
    logger.warn('[quote:notify-client]', err)
  }

  res.json(ok({ sent: true }))
}

type PopulatedVehicle = { plate?: string; make?: string; model?: string }

function mapPortalQuote(q: Record<string, unknown>) {
  const vehicle = q.vehicleId as PopulatedVehicle | string | null | undefined
  const vehicleInfo =
    vehicle && typeof vehicle === 'object' && vehicle.plate != null
      ? {
          plate: String(vehicle.plate ?? ''),
          make: String(vehicle.make ?? ''),
          model: String(vehicle.model ?? ''),
        }
      : undefined

  return {
    id: String(q.id ?? q._id ?? ''),
    number: String(q.number ?? ''),
    status: q.status,
    totalTTC: Number(q.totalTTC ?? 0),
    subtotalHT: Number(q.subtotalHT ?? 0),
    totalTVA: Number(q.totalTVA ?? 0),
    totalDiscount: Number(q.totalDiscount ?? 0),
    validUntil: q.validUntil ? new Date(String(q.validUntil)).toISOString() : undefined,
    createdAt: q.createdAt ? new Date(String(q.createdAt)).toISOString() : undefined,
    notes: q.notes ? String(q.notes) : undefined,
    lines: Array.isArray(q.lines) ? q.lines : [],
    vehicleInfo,
  }
}

export async function listForClient(req: Request, res: Response): Promise<void> {
  const clientId = req.user?.clientId
  if (!clientId) {
    res.status(403).json(fail('Client account required'))
    return
  }

  const quotes = await Quote.find({ clientId })
    .populate('vehicleId', 'plate make model')
    .sort({ createdAt: -1 })
    .lean()

  res.json(ok(quotes.map((q) => mapPortalQuote(q as unknown as Record<string, unknown>))))
}

async function findClientQuote(id: string, clientId: string) {
  return Quote.findOne({ _id: id, clientId })
}

export async function acceptQuote(req: Request, res: Response): Promise<void> {
  const clientId = req.user?.clientId
  if (!clientId) {
    res.status(403).json(fail('Client account required'))
    return
  }

  const quote = await findClientQuote(req.params.id, clientId)
  if (!quote) {
    res.status(404).json(fail('Quote not found'))
    return
  }
  if (quote.status !== 'sent') {
    res.status(400).json(fail('Seuls les devis envoyés peuvent être acceptés'))
    return
  }

  quote.status = 'accepted'
  quote.acceptedAt = new Date()
  await quote.save()

  const client = await Client.findById(clientId).select('name').lean()
  const garageId = quote.garageId

  await notifyManagers(garageId, {
    type: 'quote_accepted',
    title: 'Devis accepté par le client',
    message: `Le client a accepté le devis ${quote.number}`,
    link: `/quotes/${String(quote._id)}`,
    isRead: false,
  })

  const io = getSocketServer()
  if (io) {
    io.to(`garage:${String(garageId)}`).emit('quote:accepted', {
      quoteId: String(quote._id),
      number: quote.number,
      clientName: client?.name ?? 'Client',
    })
  }

  res.json(ok(mapPortalQuote(quote.toJSON() as unknown as Record<string, unknown>)))
}

export async function refuseQuote(req: Request, res: Response): Promise<void> {
  const clientId = req.user?.clientId
  if (!clientId) {
    res.status(403).json(fail('Client account required'))
    return
  }

  const quote = await findClientQuote(req.params.id, clientId)
  if (!quote) {
    res.status(404).json(fail('Quote not found'))
    return
  }
  if (quote.status !== 'sent') {
    res.status(400).json(fail('Seuls les devis envoyés peuvent être refusés'))
    return
  }

  quote.status = 'rejected'
  await quote.save()

  await notifyManagers(quote.garageId, {
    type: 'quote_accepted',
    title: 'Devis refusé par le client',
    message: `Le client a refusé le devis ${quote.number}`,
    link: `/quotes/${String(quote._id)}`,
    isRead: false,
  })

  const io = getSocketServer()
  if (io) {
    io.to(`garage:${String(quote.garageId)}`).emit('quote:refused', {
      quoteId: String(quote._id),
      number: quote.number,
    })
  }

  res.json(ok(mapPortalQuote(quote.toJSON() as unknown as Record<string, unknown>)))
}

export async function applyCouponToQuote(req: Request, res: Response): Promise<void> {
  const clientId = req.user?.clientId
  if (!clientId) {
    res.status(403).json(fail('Client account required'))
    return
  }

  const { couponCode } = req.body as { couponCode: string }
  const quote = await findClientQuote(req.params.id, clientId)
  if (!quote) {
    res.status(404).json(fail('Quote not found'))
    return
  }
  if (!['sent', 'accepted'].includes(quote.status)) {
    res.status(400).json(fail('Coupon applicable uniquement sur un devis envoyé ou accepté'))
    return
  }

  const now = new Date()
  const coupon = await Coupon.findOne({
    garageId: quote.garageId,
    code: couponCode.toUpperCase().trim(),
    isUsed: false,
    isActive: true,
    $or: [{ clientId: null }, { clientId: quote.clientId }],
    $and: [
      { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }] },
    ],
  })

  if (!coupon) {
    res.status(400).json(fail('Coupon invalide ou expiré'))
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

  const couponNote = `Coupon ${coupon.code} appliqué (-${remiseAppliquee} TND)`
  quote.notes = quote.notes ? `${quote.notes}\n${couponNote}` : couponNote
  await quote.save()

  coupon.isUsed = true
  coupon.usedAt = new Date()
  coupon.usedOnQuoteId = quote._id
  coupon.usedCount += 1
  await coupon.save()

  res.json(
    ok({
      nouveauTotalTTC: quote.totalTTC,
      remiseAppliquee,
      couponCode: coupon.code,
    }),
  )
}
