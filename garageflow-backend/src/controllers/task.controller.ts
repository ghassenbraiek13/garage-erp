import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { Task, type ITask } from '@/models/Task.model'
import { Repair } from '@/models/Repair.model'
import { Vehicle } from '@/models/Vehicle.model'
import { ok } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { getSocketServer } from '@/sockets/emitter'

const TaskPaged = Task as unknown as PaginateModel<ITask>

const repairPopulate = {
  path: 'repairId',
  populate: [
    { path: 'clientId', select: 'name email phone' },
    { path: 'vehicleId', select: 'make model plate' },
    { path: 'serviceIds', select: 'name price' },
  ],
}

async function fetchKanbanColumn(garageId: mongoose.Types.ObjectId, status: string, limit?: number) {
  let q = Task.find({ garageId, status }).populate(repairPopulate)
  if (status === 'done') {
    q = q.sort({ completedAt: -1 })
  }
  if (limit) q = q.limit(limit)
  return q.lean()
}

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
  const io = getSocketServer()
  io?.to(`garage:${garageId.toString()}`).emit('task:statusChanged', {
    taskId: t._id.toString(),
    status: t.status,
  })

  if (status === 'done' && t.repairId) {
    const allTasks = await Task.find({ repairId: t.repairId })
    const allDone = allTasks.length > 0 && allTasks.every((x) => x.status === 'done')
    if (allDone) {
      const completedAt = new Date()
      await Repair.findByIdAndUpdate(t.repairId, {
        status: 'completed',
        completedAt,
      })
      const repair = await Repair.findById(t.repairId).select('vehicleId')
      if (repair?.vehicleId) {
        await Vehicle.updateOne({ _id: repair.vehicleId }, { lastServiceDate: completedAt })
      }
      io?.to(`garage:${garageId.toString()}`).emit('repair:statusChanged', {
        repairId: t.repairId.toString(),
        status: 'completed',
      })
    }
  }

  res.json(ok(t.toJSON()))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  await Task.deleteOne({ _id: req.params.id, garageId })
  res.json(ok({ deleted: true }))
}

export async function me(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const userId = req.user?.sub
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }
  const tasks = await Task.find({
    garageId,
    assigneeId: new mongoose.Types.ObjectId(userId),
  })
    .populate(repairPopulate)
    .lean()
  res.json(ok(tasks))
}

export async function kanban(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const [todo, doing, done] = await Promise.all([
    fetchKanbanColumn(garageId, 'todo'),
    fetchKanbanColumn(garageId, 'in_progress'),
    fetchKanbanColumn(garageId, 'done', 50),
  ])
  res.json(ok({ todo, in_progress: doing, done }))
}
