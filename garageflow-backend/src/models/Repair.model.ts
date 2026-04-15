import mongoose, { Schema } from 'mongoose'
import type mongoosePaginate from 'mongoose-paginate-v2'
import paginate from 'mongoose-paginate-v2'
import { getSocketServer } from '@/sockets/emitter'
import { Vehicle } from './Vehicle.model'

export interface IRepair {
  garageId: mongoose.Types.ObjectId
  vehicleId: mongoose.Types.ObjectId
  clientId: mongoose.Types.ObjectId
  mechanicId?: mongoose.Types.ObjectId | null
  serviceIds: mongoose.Types.ObjectId[]
  status: 'pending' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  diagnosis?: string
  notes?: string
  internalNotes?: string
  estimatedDuration?: number
  startDate?: Date
  endDate?: Date
  completedAt?: Date
  invoiceId?: mongoose.Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const repairSchema = new Schema<IRepair>(
  {
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    mechanicId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    serviceIds: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    diagnosis: String,
    notes: String,
    internalNotes: String,
    estimatedDuration: Number,
    startDate: Date,
    endDate: Date,
    completedAt: Date,
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', default: null },
  },
  { timestamps: true },
)

repairSchema.index({ garageId: 1 })
repairSchema.index({ status: 1 })
repairSchema.index({ mechanicId: 1 })
repairSchema.index({ vehicleId: 1 })

type WithLocals = mongoose.Document & { $locals?: { prevStatus?: string } }

repairSchema.pre('save', async function preSave(next) {
  const doc = this as WithLocals
  doc.$locals = doc.$locals ?? {}
  if (doc.isModified('status') && !doc.isNew) {
    const ex = await Repair.findById(doc._id).select('status').lean()
    doc.$locals.prevStatus = ex?.status
  }
  next()
})

repairSchema.post('save', async function postSave(doc) {
  const prev = (doc as WithLocals).$locals?.prevStatus
  const cur = doc.status
  if (prev !== undefined && prev !== cur) {
    const sio = getSocketServer()
    if (sio) {
      sio.to(`garage:${doc.garageId.toString()}`).emit('repair:statusChanged', {
        repairId: doc._id.toString(),
        status: cur,
        vehicleId: doc.vehicleId.toString(),
        mechanicId: doc.mechanicId?.toString() ?? null,
      })
    }
  }
  if (cur === 'completed') {
    await Vehicle.updateOne({ _id: doc.vehicleId }, { lastServiceDate: doc.completedAt ?? new Date() })
  }
})

repairSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

repairSchema.plugin(paginate as typeof mongoosePaginate)

export const Repair = mongoose.model<IRepair>('Repair', repairSchema)
