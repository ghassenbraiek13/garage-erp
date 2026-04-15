import mongoose, { Schema } from 'mongoose'
import type mongoosePaginate from 'mongoose-paginate-v2'
import paginate from 'mongoose-paginate-v2'

export interface IVehicle {
  garageId: mongoose.Types.ObjectId
  clientId: mongoose.Types.ObjectId
  plate: string
  vin?: string
  make: string
  model: string
  year?: number
  engine?: string
  fuelType?: 'essence' | 'diesel' | 'hybride' | 'electrique' | 'autre'
  color?: string
  mileage?: number
  lastServiceDate?: Date
  nextServiceDate?: Date
  photos: string[]
  createdAt: Date
  updatedAt: Date
}

const vehicleSchema = new Schema<IVehicle>(
  {
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    plate: { type: String, required: true, uppercase: true, trim: true },
    vin: { type: String, uppercase: true, trim: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: Number,
    engine: String,
    fuelType: {
      type: String,
      enum: ['essence', 'diesel', 'hybride', 'electrique', 'autre'],
    },
    color: String,
    mileage: Number,
    lastServiceDate: Date,
    nextServiceDate: Date,
    photos: [{ type: String }],
  },
  { timestamps: true },
)

vehicleSchema.index({ garageId: 1 })
vehicleSchema.index({ clientId: 1 })
vehicleSchema.index({ plate: 1 })
vehicleSchema.index({ vin: 1 })

vehicleSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

vehicleSchema.plugin(paginate as typeof mongoosePaginate)

export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema)
