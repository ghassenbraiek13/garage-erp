import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { Invoice, type IInvoice } from '@/models/Invoice.model'
import type { IQuoteLine } from '@/models/Quote.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { generateInvoicePDF } from '@/services/pdf.service'
import { sendPdfAttachment } from '@/services/email.service'
import { Client } from '@/models/Client.model'
import { Garage } from '@/models/Garage.model'
import { exportInvoicesMonthExcel } from '@/services/excel.service'

const InvoicePaged = Invoice as unknown as PaginateModel<IInvoice>

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
  const result = await InvoicePaged.paginate(filter, { page, limit, sort: { [sort]: order } })
  res.json(ok(result.docs, buildMeta(result.totalDocs, page, limit)))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const inv = await Invoice.findOne({ _id: req.params.id, garageId })
  if (!inv) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(inv.toJSON()))
}

export async function create(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const body = req.body as Record<string, unknown>
  const inv = await Invoice.create({
    ...body,
    garageId,
    clientId: new mongoose.Types.ObjectId(String(body.clientId)),
    vehicleId: body.vehicleId ? new mongoose.Types.ObjectId(String(body.vehicleId)) : undefined,
    quoteId: body.quoteId ? new mongoose.Types.ObjectId(String(body.quoteId)) : undefined,
    repairId: body.repairId ? new mongoose.Types.ObjectId(String(body.repairId)) : undefined,
    lines: mapLines(body.lines as unknown[]),
    dueDate: body.dueDate ? new Date(String(body.dueDate)) : undefined,
  })
  res.status(201).json(ok(inv.toJSON()))
}

export async function update(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const existing = await Invoice.findOne({ _id: req.params.id, garageId })
  if (!existing) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  if (!['unpaid', 'partial', 'overdue'].includes(existing.status)) {
    res.status(400).json({ success: false, message: 'Invoice locked' })
    return
  }
  const body = req.body as Record<string, unknown>
  const payload = { ...body } as Record<string, unknown>
  if (body.lines) payload.lines = mapLines(body.lines as unknown[])
  const inv = await Invoice.findOneAndUpdate({ _id: existing._id, garageId }, payload, { new: true })
  res.json(ok(inv!.toJSON()))
}

export async function pay(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { paymentMethod } = req.body as { paymentMethod: string }
  const inv = await Invoice.findOne({ _id: req.params.id, garageId })
  if (!inv) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  inv.status = 'paid'
  inv.paymentMethod = paymentMethod as IInvoice['paymentMethod']
  inv.paidAt = new Date()
  await inv.save()
  res.json(ok(inv.toJSON()))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const inv = await Invoice.findOne({ _id: req.params.id, garageId })
  if (!inv) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  if (!['unpaid', 'partial', 'overdue'].includes(inv.status)) {
    res.status(400).json({ success: false, message: 'Cannot delete' })
    return
  }
  await inv.deleteOne()
  res.json(ok({ deleted: true }))
}

export async function pdf(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const inv = await Invoice.findOne({ _id: req.params.id, garageId })
  if (!inv) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  const [g, c] = await Promise.all([Garage.findById(garageId), Client.findById(inv.clientId)])
  const buf = await generateInvoicePDF({ ...inv.toObject(), garage: g ?? undefined, client: c ?? undefined })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${inv.number}.pdf"`)
  res.send(buf)
}

export async function sendEmail(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const inv = await Invoice.findOne({ _id: req.params.id, garageId })
  if (!inv) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  const c = await Client.findById(inv.clientId)
  const g = await Garage.findById(garageId)
  if (!c?.email) {
    res.status(400).json({ success: false, message: 'Client has no email' })
    return
  }
  const buf = await generateInvoicePDF({ ...inv.toObject(), garage: g ?? undefined, client: c ?? undefined })
  await sendPdfAttachment(c.email, `Facture ${inv.number}`, `${inv.number}.pdf`, buf)
  res.json(ok({ sent: true }))
}

export async function exportExcel(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const month = Number(req.query.month) || new Date().getMonth() + 1
  const year = Number(req.query.year) || new Date().getFullYear()
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)
  const rows = await Invoice.find({ garageId, createdAt: { $gte: start, $lte: end } }).lean()
  const buf = await exportInvoicesMonthExcel(
    rows.map((r) => ({
      number: r.number,
      clientId: r.clientId.toString(),
      totalTTC: r.totalTTC,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  )
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="invoices.xlsx"')
  res.send(buf)
}
