import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { Client, type IClient } from '@/models/Client.model'
import { Vehicle } from '@/models/Vehicle.model'
import { Repair } from '@/models/Repair.model'
import { Invoice } from '@/models/Invoice.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { exportClientsExcel } from '@/services/excel.service'
import { generateClientsListPdf } from '@/services/pdf.service'

const ClientPaged = Client as unknown as PaginateModel<IClient>

export async function list(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { page, limit, sort, order, search } = parsePagination(req.query as Record<string, unknown>)
  const filter: Record<string, unknown> = { garageId }
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
    ]
  }
  const result = await ClientPaged.paginate(filter, {
    page,
    limit,
    sort: { [sort]: order },
  })
  res.json(ok(result.docs, buildMeta(result.totalDocs, page, limit)))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const c = await Client.findOne({ _id: req.params.id, garageId })
  if (!c) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(c.toJSON()))
}

export async function create(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const c = await Client.create({ ...req.body, garageId })
  res.status(201).json(ok(c.toJSON()))
}

export async function update(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const c = await Client.findOneAndUpdate({ _id: req.params.id, garageId }, req.body, { new: true })
  if (!c) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(c.toJSON()))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  await Client.deleteOne({ _id: req.params.id, garageId })
  res.json(ok({ deleted: true }))
}

export async function vehicles(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const listV = await Vehicle.find({ garageId, clientId: req.params.id }).lean()
  res.json(ok(listV))
}

export async function repairs(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const listR = await Repair.find({ garageId, clientId: req.params.id }).sort({ createdAt: -1 }).lean()
  res.json(ok(listR))
}

export async function invoices(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const listI = await Invoice.find({ garageId, clientId: req.params.id }).sort({ createdAt: -1 }).lean()
  res.json(ok(listI))
}

export async function loyalty(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const c = await Client.findOne({ _id: req.params.id, garageId }).lean()
  if (!c) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  const count = await Repair.countDocuments({ garageId, clientId: c._id })
  res.json(ok({ ...c, interventionCount: count }))
}

export async function addPoints(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { points } = req.body as { points: number }
  const c = await Client.findOneAndUpdate(
    { _id: req.params.id, garageId },
    { $inc: { loyaltyPoints: points } },
    { new: true },
  )
  if (!c) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(c.toJSON()))
}

export async function exportExcel(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const clients = await Client.find({ garageId }).lean()
  const rows = await Promise.all(
    clients.map(async (c) => ({
      id: c._id.toString(),
      name: c.name,
      email: c.email ?? '',
      phone: c.phone,
      vehicles: c.vehicleIds?.length ?? 0,
      points: c.loyaltyPoints,
      spent: c.totalSpent,
      created: c.createdAt.toISOString().slice(0, 10),
    })),
  )
  const buf = await exportClientsExcel(rows)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="clients.xlsx"')
  res.send(buf)
}

export async function exportPdf(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const clients = await Client.find({ garageId }).lean()
  const rows = clients.map((c) => [
    c._id.toString(),
    c.name,
    c.email ?? '',
    c.phone,
    String(c.loyaltyPoints),
    String(c.totalSpent),
  ])
  const buf = await generateClientsListPdf(rows)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="clients.pdf"')
  res.send(buf)
}
