import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { DiagnosticReport, type IDiagnosticReport } from '@/models/DiagnosticReport.model'
import { Repair } from '@/models/Repair.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import type { JwtPayload } from '@/types/express'

const ReportPaged = DiagnosticReport as unknown as PaginateModel<IDiagnosticReport>

function sanitizeForRole(doc: Record<string, unknown>, user?: JwtPayload): Record<string, unknown> {
  if (user?.role === 'client') {
    const { internalNotes: _i, ...rest } = doc
    return rest
  }
  return doc
}

function buildListFilter(req: Request, garageId: mongoose.Types.ObjectId): Record<string, unknown> {
  const filter: Record<string, unknown> = { garageId }
  const user = req.user

  if (user?.role === 'client' && user.clientId) {
    filter.clientId = new mongoose.Types.ObjectId(user.clientId)
    filter.visibleToClient = true
    filter.status = 'finalized'
  }

  if (typeof req.query.repairId === 'string' && mongoose.isValidObjectId(req.query.repairId)) {
    filter.repairId = new mongoose.Types.ObjectId(req.query.repairId)
  }
  if (typeof req.query.clientId === 'string' && mongoose.isValidObjectId(req.query.clientId)) {
    filter.clientId = new mongoose.Types.ObjectId(req.query.clientId)
  }
  if (typeof req.query.vehicleId === 'string' && mongoose.isValidObjectId(req.query.vehicleId)) {
    filter.vehicleId = new mongoose.Types.ObjectId(req.query.vehicleId)
  }
  if (typeof req.query.status === 'string') {
    filter.status = req.query.status
  }

  return filter
}

export async function list(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { page, limit, sort, order } = parsePagination(req.query as Record<string, unknown>)
  const filter = buildListFilter(req, garageId)
  const result = await ReportPaged.paginate(filter, {
    page,
    limit,
    sort: { [sort]: order },
    populate: [
      { path: 'serviceId', select: 'name category diagnosticKind' },
      { path: 'mechanicId', select: 'name' },
      { path: 'vehicleId', select: 'plate make model' },
    ],
  })
  const docs = result.docs.map((d) => sanitizeForRole(d.toJSON() as Record<string, unknown>, req.user))
  res.json(ok(docs, buildMeta(result.totalDocs, page, limit)))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const filter: Record<string, unknown> = { _id: req.params.id, garageId }
  const user = req.user
  if (user?.role === 'client' && user.clientId) {
    filter.clientId = new mongoose.Types.ObjectId(user.clientId)
    filter.visibleToClient = true
    filter.status = 'finalized'
  }

  const r = await DiagnosticReport.findOne(filter)
    .populate('serviceId', 'name category diagnosticKind')
    .populate('mechanicId', 'name')
    .populate('vehicleId', 'plate make model')
    .populate('clientId', 'name')

  if (!r) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(sanitizeForRole(r.toJSON() as Record<string, unknown>, req.user)))
}

export async function create(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const body = req.body as Record<string, unknown>
  const mechanicId =
    (typeof body.mechanicId === 'string' && body.mechanicId) ||
    (req.user?.role === 'mechanic' ? req.user.sub : undefined)

  if (!mechanicId || !mongoose.isValidObjectId(mechanicId)) {
    res.status(400).json({ success: false, message: 'mechanicId required' })
    return
  }

  const r = await DiagnosticReport.create({
    ...body,
    garageId,
    mechanicId: new mongoose.Types.ObjectId(mechanicId),
    status: 'draft',
    visibleToClient: body.visibleToClient !== false,
  })

  if (body.repairId && typeof body.repairId === 'string') {
    const summary = String(body.clientSummary ?? body.findings ?? '').slice(0, 500)
    await Repair.findOneAndUpdate(
      { _id: body.repairId, garageId },
      {
        $set: { diagnosis: summary },
        $addToSet: { serviceIds: body.serviceId },
      },
    )
  }

  res.status(201).json(ok(r.toJSON()))
}

export async function update(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const body = { ...req.body } as Record<string, unknown>
  delete body.garageId
  delete body.clientId

  if (body.status === 'finalized') {
    body.finalizedAt = new Date()
  }

  const r = await DiagnosticReport.findOneAndUpdate({ _id: req.params.id, garageId }, body, { new: true })
  if (!r) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }

  if (r.repairId && (body.findings || body.clientSummary)) {
    const summary = String(body.clientSummary ?? body.findings ?? r.clientSummary).slice(0, 500)
    await Repair.updateOne({ _id: r.repairId, garageId }, { $set: { diagnosis: summary } })
  }

  res.json(ok(r.toJSON()))
}

export async function finalize(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const r = await DiagnosticReport.findOneAndUpdate(
    { _id: req.params.id, garageId },
    { status: 'finalized', finalizedAt: new Date() },
    { new: true },
  )
  if (!r) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(r.toJSON()))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const deleted = await DiagnosticReport.deleteOne({ _id: req.params.id, garageId })
  if (!deleted.deletedCount) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok({ deleted: true }))
}
