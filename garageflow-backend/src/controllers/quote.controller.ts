import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { Quote, type IQuote, type IQuoteLine } from '@/models/Quote.model'
import { Invoice } from '@/models/Invoice.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { generateQuotePDF } from '@/services/pdf.service'
import { sendPdfAttachment } from '@/services/email.service'
import { Client } from '@/models/Client.model'
import { Garage } from '@/models/Garage.model'

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
  const filter: Record<string, unknown> = { garageId }
  if (typeof req.query.status === 'string') filter.status = req.query.status
  const result = await QuotePaged.paginate(filter, { page, limit, sort: { [sort]: order } })
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
    res.status(404).json({ success: false, message: 'Not found' })
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
  await sendPdfAttachment(c.email, `Devis ${q.number}`, `${q.number}.pdf`, buf)
  q.status = 'sent'
  q.sentAt = new Date()
  await q.save()
  res.json(ok({ sent: true }))
}
