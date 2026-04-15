import mongoose, { Schema } from 'mongoose'
import type mongoosePaginate from 'mongoose-paginate-v2'
import paginate from 'mongoose-paginate-v2'

export interface IAppointment {
  garageId: mongoose.Types.ObjectId
  clientId: mongoose.Types.ObjectId
  vehicleId: mongoose.Types.ObjectId
  serviceId?: mongoose.Types.ObjectId | null
  mechanicId?: mongoose.Types.ObjectId | null
  start: Date
  end: Date
  notes?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  reminderSent: boolean
  createdAt: Date
  updatedAt: Date
}

const appointmentSchema = new Schema<IAppointment>(
  {
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', default: null },
    mechanicId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    notes: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
      default: 'pending',
    },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true },
)

appointmentSchema.index({ garageId: 1 })
appointmentSchema.index({ start: 1 })
appointmentSchema.index({ mechanicId: 1 })
appointmentSchema.index({ status: 1 })

appointmentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

appointmentSchema.plugin(paginate as typeof mongoosePaginate)

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema)
