import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { Task, type ITask } from '@/models/Task.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { getSocketServer } from '@/sockets/emitter'

const TaskPaged = Task as unknown as PaginateModel<ITask>

export async function list(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { page, limit, sort, order } = parsePagination(req.query as Record<string, unknown>)
  const filter: Record<string, unknown> = { garageId }
  if (typeof req.query.status === 'string') filter.status = req.query.status
  if (typeof req.query.assigneeId === 'string' && mongoose.isValidObjectId(req.query.assigneeId)) {
    filter.assigneeId = new mongoose.Types.ObjectId(req.query.assigneeId)
  }
  const result = await TaskPaged.paginate(filter, { page, limit, sort: { [sort]: order } })
  res.json(ok(result.docs, buildMeta(result.totalDocs, page, limit)))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const t = await Task.findOne({ _id: req.params.id, garageId })
  if (!t) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(t.toJSON()))
}

export async function create(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const body = req.body as Record<string, unknown>
  const t = await Task.create({
    ...body,
    garageId,
    assigneeId: body.assigneeId ? new mongoose.Types.ObjectId(String(body.assigneeId)) : null,
    vehicleId: body.vehicleId ? new mongoose.Types.ObjectId(String(body.vehicleId)) : null,
    repairId: body.repairId ? new mongoose.Types.ObjectId(String(body.repairId)) : null,
    dueDate: body.dueDate ? new Date(String(body.dueDate)) : undefined,
  })
  res.status(201).json(ok(t.toJSON()))
}

export async function update(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const body = req.body as Record<string, unknown>
  const payload = { ...body } as Record<string, unknown>
  if (body.assigneeId) payload.assigneeId = new mongoose.Types.ObjectId(String(body.assigneeId))
  if (body.vehicleId) payload.vehicleId = new mongoose.Types.ObjectId(String(body.vehicleId))
  if (body.repairId) payload.repairId = new mongoose.Types.ObjectId(String(body.repairId))
  if (body.dueDate) payload.dueDate = new Date(String(body.dueDate))
  const t = await Task.findOneAndUpdate({ _id: req.params.id, garageId }, payload, { new: true })
  if (!t) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  res.json(ok(t.toJSON()))
}

export async function patchStatus(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const { status } = req.body as { status: string }
  const t = await Task.findOneAndUpdate(
    { _id: req.params.id, garageId },
    {
      status,
      ...(status === 'done' ? { completedAt: new Date() } : {}),
    },
    { new: true },
  )
  if (!t) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  getSocketServer()?.to(`garage:${garageId.toString()}`).emit('task:statusChanged', {
    taskId: t._id.toString(),
    status: t.status,
  })
  res.json(ok(t.toJSON()))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  await Task.deleteOne({ _id: req.params.id, garageId })
  res.json(ok({ deleted: true }))
}

export async function kanban(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const [todo, doing, done] = await Promise.all([
    Task.find({ garageId, status: 'todo' }).lean(),
    Task.find({ garageId, status: 'in_progress' }).lean(),
    Task.find({ garageId, status: 'done' }).sort({ completedAt: -1 }).limit(50).lean(),
  ])
  res.json(ok({ todo, in_progress: doing, done }))
}
