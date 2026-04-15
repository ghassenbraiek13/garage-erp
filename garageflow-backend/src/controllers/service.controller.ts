import type { Request, Response } from 'express'
import type { PaginateModel } from 'mongoose'
import { Service, type IService } from '@/models/Service.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'

const ServicePaged = Service as unknown as PaginateModel<IService>

const CATEGORIES = [
  'lavage',
  'vidange',
  'freinage',
  'diagnostic',
  'pneumatique',
  'carrosserie',
  'electricite',
  'climatisation',
  'autre',
] as const

export async function list(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { page, limit, sort, order, search } = parsePagination(req.query as Record<string, unknown>)
  const filter: Record<string, unknown> = { garageId }
  if (search) filter.name = new RegExp(search, 'i')
  const result = await ServicePaged.paginate(filter, { page, limit, sort: { [sort]: order } })
  res.json(ok(result.docs, buildMeta(result.totalDocs, page, limit)))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const s = await Service.findOne({ _id: req.params.id, garageId })
  if (!s) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(s.toJSON()))
}

export async function create(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const s = await Service.create({ ...req.body, garageId })
  res.status(201).json(ok(s.toJSON()))
}

export async function update(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const s = await Service.findOneAndUpdate({ _id: req.params.id, garageId }, req.body, { new: true })
  if (!s) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(s.toJSON()))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  await Service.deleteOne({ _id: req.params.id, garageId })
  res.json(ok({ deleted: true }))
}

export async function categories(_req: Request, res: Response): Promise<void> {
  res.json(ok([...CATEGORIES]))
}
