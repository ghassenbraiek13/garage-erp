import type { Request, Response } from 'express'
import crypto from 'crypto'
import mongoose from 'mongoose'
import type { PaginateModel } from 'mongoose'
import { Client, type IClient } from '@/models/Client.model'
import { Garage } from '@/models/Garage.model'
import { Vehicle } from '@/models/Vehicle.model'
import { Repair } from '@/models/Repair.model'
import { Invoice } from '@/models/Invoice.model'
import { User } from '@/models/User.model'
import { ok, fail } from '@/utils/apiResponse'
import { parsePagination, buildMeta } from '@/utils/pagination'
import { assertGarage } from '@/utils/garageScope'
import { exportClientsExcel } from '@/services/excel.service'
import { generateClientsListPdf, generateMaintenanceBookletPdf } from '@/services/pdf.service'
import { sendEmail, sendWelcomeEmail } from '@/services/email.service'
import { getEnv } from '@/config/env'

function generateTempPassword(): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '0123456789'
  const all = lower + upper + digits
  const arr = [
    lower[crypto.randomInt(lower.length)],
    upper[crypto.randomInt(upper.length)],
    digits[crypto.randomInt(digits.length)],
  ]
  for (let i = 0; i < 8; i++) arr.push(all[crypto.randomInt(all.length)])
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr.join('')
}

type PortalProvisionResult = { userId?: string; warning?: string }

async function provisionPortalAccess(
  c: IClient & { _id: mongoose.Types.ObjectId },
  garageId: mongoose.Types.ObjectId,
  opts: { password?: string; sendEmail?: boolean; welcomeEmail?: boolean } = {},
): Promise<PortalProvisionResult> {
  if (!c.email) {
    return { warning: 'Client créé sans email — aucun compte portail' }
  }
  const emailLower = c.email.toLowerCase().trim()
  const existing = await User.findOne({ email: emailLower })
  if (existing) {
    return { warning: 'Un compte existe déjà pour cet email' }
  }
  const plain = opts.password ?? crypto.randomBytes(8).toString('hex')
  const u = await User.create({
    email: emailLower,
    password: plain,
    name: c.name,
    role: 'client',
    garageId,
    clientId: c._id,
    isActive: true,
  })
  if (opts.sendEmail || opts.welcomeEmail) {
    const env = getEnv()
    if (opts.welcomeEmail) {
      try {
        await sendWelcomeEmail(
          emailLower,
          c.name ?? 'Client',
          plain,
          `${env.BACKEND_URL}/portal`,
        )
      } catch (emailErr) {
        console.error('[welcome email error]', emailErr)
      }
    } else {
      await sendEmail({
        to: emailLower,
        subject: 'GarageFlow — Accès portail client',
        html: `<p>Bonjour,</p><p>Votre accès au portail GarageFlow est activé.</p><p><strong>Email :</strong> ${emailLower}<br/><strong>Mot de passe temporaire :</strong> ${plain}</p><p>Connexion : ${env.BACKEND_URL}/portal/login</p>`,
      })
    }
  }
  return { userId: u._id.toString() }
}

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
  const clientIds = result.docs.map((d) => d._id)
  const lastVisits = await Repair.aggregate<{ _id: mongoose.Types.ObjectId; lastVisitAt: Date }>([
    { $match: { garageId, clientId: { $in: clientIds }, status: 'completed' } },
    { $group: { _id: '$clientId', lastVisitAt: { $max: { $ifNull: ['$completedAt', '$endDate', '$createdAt'] } } } },
  ])
  const lastMap = new Map(lastVisits.map((r) => [r._id.toString(), r.lastVisitAt]))
  const enriched = result.docs.map((d) => {
    const json = d.toJSON() as Record<string, unknown>
    const lv = lastMap.get(d._id.toString())
    if (lv) json.lastVisitAt = lv
    return json
  })
  res.json(ok(enriched, buildMeta(result.totalDocs, page, limit)))
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
  const clientJson = c.toJSON() as Record<string, unknown>
  let portal: PortalProvisionResult = {}
  try {
    portal = await provisionPortalAccess(c, garageId, { welcomeEmail: true, sendEmail: true })
  } catch {
    portal = { warning: 'Compte portail ou email de bienvenue non créé' }
  }
  res.status(201).json(
    ok({
      ...clientJson,
      clientId: c._id.toString(),
      userId: portal.userId,
      portalWarning: portal.warning,
    }),
  )
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

export async function exportCarnetPDF(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const clientId = req.params.id
  const vehicleId = String(req.query.vehiculeId ?? req.query.vehicleId ?? '')
  if (!mongoose.isValidObjectId(clientId) || !mongoose.isValidObjectId(vehicleId)) {
    res.status(400).json(fail('clientId et vehiculeId requis'))
    return
  }
  if (req.user?.role === 'client') {
    if (!req.user.clientId || req.user.clientId !== clientId) {
      res.status(403).json(fail('Forbidden'))
      return
    }
  }
  const client = await Client.findOne({ _id: clientId, garageId }).lean()
  if (!client) {
    res.status(404).json(fail('Client introuvable'))
    return
  }
  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    garageId,
    clientId: new mongoose.Types.ObjectId(clientId),
  }).lean()
  if (!vehicle) {
    res.status(404).json(fail('Véhicule introuvable'))
    return
  }
  const garage = await Garage.findById(garageId).lean()
  const repairs = await Repair.find({
    garageId,
    clientId: new mongoose.Types.ObjectId(clientId),
    vehicleId: new mongoose.Types.ObjectId(vehicleId),
  })
    .populate('mechanicId', 'name')
    .populate('serviceIds', 'name')
    .sort({ startDate: -1, createdAt: -1 })
    .lean()
  const rows = repairs.map((r) => {
    const services = Array.isArray(r.serviceIds)
      ? r.serviceIds
          .map((s) => (s && typeof s === 'object' && 'name' in s ? String((s as { name: string }).name) : ''))
          .filter(Boolean)
          .join(', ')
      : ''
    const mech =
      r.mechanicId && typeof r.mechanicId === 'object' && 'name' in r.mechanicId
        ? String((r.mechanicId as { name: string }).name)
        : '—'
    const date = r.startDate ?? r.completedAt ?? r.createdAt
    return {
      date: date ? new Date(date).toLocaleDateString('fr-FR') : '—',
      service: services || r.notes || '—',
      mileage: vehicle.mileage != null ? String(vehicle.mileage) : '—',
      mechanic: mech,
      status: r.status,
    }
  })
  const buf = await generateMaintenanceBookletPdf({
    garageName: garage?.name ?? 'GarageFlow',
    client: { name: client.name, email: client.email, phone: client.phone },
    vehicle: {
      plate: vehicle.plate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
    },
    rows,
  })
  const plateSafe = vehicle.plate.replace(/[^a-zA-Z0-9-]/g, '_')
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="carnet-${plateSafe}.pdf"`)
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

export async function createPortalAccess(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const c = await Client.findOne({ _id: req.params.id, garageId })
  if (!c) {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }
  if (!c.email) {
    res.status(400).json({ success: false, message: 'Client sans email' })
    return
  }
  const emailLower = c.email.toLowerCase().trim()
  const existing = await User.findOne({ email: emailLower })
  if (existing) {
    res.status(409).json({ success: false, message: 'Un compte existe déjà pour cet email' })
    return
  }
  const { password, sendEmail } = req.body as { password?: string; sendEmail?: boolean }
  const plain = password ?? generateTempPassword()
  const portal = await provisionPortalAccess(c, garageId, { password: plain, sendEmail: Boolean(sendEmail) })
  if (portal.warning && !portal.userId) {
    res.status(409).json({ success: false, message: portal.warning })
    return
  }
  const u = await User.findOne({ email: emailLower })
  res.status(201).json(ok({ user: u?.toJSON(), tempPassword: plain, userId: portal.userId }))
}

export async function removePortalAccess(req: Request, res: Response): Promise<void> {
  const garageId = assertGarage(req)
  const r = await User.deleteOne({ garageId, clientId: req.params.id, role: 'client' })
  if (r.deletedCount === 0) {
    res.status(404).json({ success: false, message: 'Aucun accès portail' })
    return
  }
  res.json(ok({ deleted: true }))
}
