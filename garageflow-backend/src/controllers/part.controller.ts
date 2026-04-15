import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import path from 'path'
import sharp from 'sharp'
import fs from 'fs/promises'
import { Part, type IPart } from '@/models/Part.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { exportStockExcel } from '@/services/excel.service'

const PartPaged = Part as unknown as PaginateModel<IPart>

export async function list(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { page, limit, sort, order, search } = parsePagination(req.query as Record<string, unknown>)
  const filter: Record<string, unknown> = { garageId }
  if (typeof req.query.category === 'string') filter.category = req.query.category
  if (req.query.lowStock === 'true') {
    filter.$expr = { $lt: ['$stock', '$minStock'] }
  }
  if (search) {
    filter.$or = [{ name: new RegExp(search, 'i') }, { reference: new RegExp(search, 'i') }]
  }
  const result = await PartPaged.paginate(filter, { page, limit, sort: { [sort]: order } })
  res.json(ok(result.docs, buildMeta(result.totalDocs, page, limit)))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const p = await Part.findOne({ _id: req.params.id, garageId })
  if (!p) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(p.toJSON()))
}

export async function create(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const p = await Part.create({ ...req.body, garageId })
  res.status(201).json(ok(p.toJSON()))
}

export async function update(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const p = await Part.findOneAndUpdate({ _id: req.params.id, garageId }, req.body, { new: true })
  if (!p) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(p.toJSON()))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  await Part.deleteOne({ _id: req.params.id, garageId })
  res.json(ok({ deleted: true }))
}

export async function patchStock(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { quantity, operation } = req.body as { quantity: number; operation: 'add' | 'subtract' }
  const p = await Part.findOne({ _id: req.params.id, garageId })
  if (!p) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  const delta = operation === 'add' ? quantity : -quantity
  p.stock = Math.max(0, p.stock + delta)
  await p.save()
  res.json(ok(p.toJSON()))
}

export async function patchVisibility(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { isPublic } = req.body as { isPublic: boolean }
  const p = await Part.findOneAndUpdate({ _id: req.params.id, garageId }, { isPublic }, { new: true })
  if (!p) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(p.toJSON()))
}

export async function uploadPhotos(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const p = await Part.findOne({ _id: req.params.id, garageId })
  if (!p) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  const file = req.file
  if (!file) {
    res.status(400).json({ success: false, message: 'No file' })
    return
  }
  const full = file.path
  const buf = await sharp(full).resize(1200, 1200, { fit: 'inside' }).toBuffer()
  await fs.writeFile(full, buf)
  const rel = path.posix.join('parts', file.filename)
  p.photos = [...(p.photos ?? []), rel]
  await p.save()
  res.json(ok({ photos: p.photos }))
}

export async function lowStock(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const parts = await Part.find({ garageId, $expr: { $lt: ['$stock', '$minStock'] } }).limit(100).lean()
  res.json(ok(parts))
}

export async function exportExcel(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const parts = await Part.find({ garageId }).lean()
  const buf = await exportStockExcel(
    parts.map((p) => ({
      reference: p.reference,
      name: p.name,
      category: p.category ?? '',
      price: p.price,
      purchase: p.purchasePrice,
      stock: p.stock,
      minStock: p.minStock,
      supplier: p.supplier,
    })),
  )
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="stock.xlsx"')
  res.send(buf)
}
