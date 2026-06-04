import type { Request, Response } from 'express'
import mongoose, { Types } from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { Invoice, type IInvoice } from '@/models/Invoice.model'
import type { IQuoteLine } from '@/models/Quote.model'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { generateInvoicePDF } from '@/services/pdf.service'
import { sendInvoiceViaWebhook, sendInvoiceEmailDirect } from '@/services/email.service'
import { Client } from '@/models/Client.model'
import { Garage } from '@/models/Garage.model'
import { User } from '@/models/User.model'
import { Notification } from '@/models/Notification.model'
import { fail, ok } from '@/utils/apiResponse'
import { exportInvoicesMonthExcel } from '@/services/excel.service'
import { getEnv } from '@/config/env'

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

  const result = await InvoicePaged.paginate(query, { page, limit, sort: { [sort]: order } })
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
  const invoice = await Invoice.findOne({ _id: req.params.id, garageId })
  if (!invoice) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  const client = await Client.findById(invoice.clientId)
  if (!client?.email) {
    res.status(400).json({ success: false, message: 'Client has no email' })
    return
  }
  const env = getEnv()
  const pdfUrl = `${env.BACKEND_URL}/api/v1/invoices/${String(invoice._id)}/pdf`
  const clientName = (client as { nom?: string; name?: string }).nom ?? client.name ?? 'Client'

  const sentViaN8n = await sendInvoiceViaWebhook(
    client.email,
    clientName,
    invoice.number,
    invoice.totalTTC,
    pdfUrl,
    String(invoice._id),
    String(invoice.garageId),
  )
  if (!sentViaN8n) {
    await sendInvoiceEmailDirect(
      client.email,
      clientName,
      invoice.number,
      invoice.totalTTC,
      pdfUrl,
    )
  }

  try {
    const clientUser = await User.findOne({ clientId: invoice.clientId }).select('_id').lean()
    if (clientUser) {
      await Notification.create({
        garageId: invoice.garageId,
        userId: clientUser._id,
        type: 'payment_received',
        title: 'Nouvelle facture disponible',
        message: `Votre facture ${invoice.number} de ${invoice.totalTTC} TND est disponible.`,
        link: '/portal/invoices',
        isRead: false,
      })

      const io = req.app.get('io') as import('socket.io').Server
      if (io) {
        io.to(String(invoice.clientId)).emit('invoice:new', {
          title: 'Nouvelle facture disponible 📄',
          message: `Facture ${invoice.number} — ${invoice.totalTTC} TND`,
          invoiceId: String(invoice._id),
          number: invoice.number,
          link: '/portal/invoices',
        })
      }
    }
  } catch (notifErr) {
    console.error('[invoice notification error]', notifErr)
  }

  res.json(
    ok({
      message: sentViaN8n ? 'Email envoyé via n8n' : 'Email envoyé directement',
    }),
  )
}

type PopulatedVehicle = { plate?: string; make?: string; model?: string }

function mapPortalInvoice(inv: Record<string, unknown>) {
  const vehicle = inv.vehicleId as PopulatedVehicle | string | null | undefined
  const vehicleInfo =
    vehicle && typeof vehicle === 'object' && vehicle.plate != null
      ? {
          plate: String(vehicle.plate ?? ''),
          make: String(vehicle.make ?? ''),
          model: String(vehicle.model ?? ''),
        }
      : undefined

  return {
    id: String(inv.id ?? inv._id ?? ''),
    number: String(inv.number ?? ''),
    status: inv.status,
    totalTTC: Number(inv.totalTTC ?? 0),
    subtotalHT: Number(inv.subtotalHT ?? 0),
    dueDate: inv.dueDate ? new Date(String(inv.dueDate)).toISOString() : undefined,
    paidAt: inv.paidAt ? new Date(String(inv.paidAt)).toISOString() : undefined,
    paymentMethod: inv.paymentMethod ? String(inv.paymentMethod) : undefined,
    createdAt: inv.createdAt ? new Date(String(inv.createdAt)).toISOString() : undefined,
    lines: Array.isArray(inv.lines) ? inv.lines : [],
    vehicleInfo,
  }
}

export async function listForClient(req: Request, res: Response): Promise<void> {
  const clientId = req.user?.clientId
  if (!clientId) {
    res.status(403).json(fail('Client account required'))
    return
  }

  const invoices = await Invoice.find({ clientId })
    .populate('vehicleId', 'plate make model')
    .sort({ createdAt: -1 })
    .lean()

  res.json(ok(invoices.map((inv) => mapPortalInvoice(inv as unknown as Record<string, unknown>))))
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
