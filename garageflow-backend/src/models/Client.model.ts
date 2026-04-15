import mongoose, { Schema } from 'mongoose'
import type mongoosePaginate from 'mongoose-paginate-v2'
import paginate from 'mongoose-paginate-v2'

export interface IClient {
  garageId: mongoose.Types.ObjectId
  name: string
  email?: string
  phone: string
  address?: {
    street?: string
    city?: string
    postalCode?: string
  }
  loyaltyPoints: number
  loyaltyTier: 'bronze' | 'silver' | 'gold'
  totalSpent: number
  vehicleIds: mongoose.Types.ObjectId[]
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const clientSchema = new Schema<IClient>(
  {
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true },
    address: {
      street: String,
      city: String,
      postalCode: String,
    },
    loyaltyPoints: { type: Number, default: 0 },
    loyaltyTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold'],
      default: 'bronze',
    },
    totalSpent: { type: Number, default: 0 },
    vehicleIds: [{ type: Schema.Types.ObjectId, ref: 'Vehicle' }],
    notes: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true } },
)

clientSchema.index({ garageId: 1 })
clientSchema.index({ email: 1 })
clientSchema.index({ phone: 1 })

function tierFromPoints(points: number): 'bronze' | 'silver' | 'gold' {
  if (points >= 5000) return 'gold'
  if (points >= 1000) return 'silver'
  return 'bronze'
}

clientSchema.post('save', async function postSave(doc) {
  const nextTier = tierFromPoints(doc.loyaltyPoints)
  if (doc.loyaltyTier !== nextTier) {
    await mongoose.model<IClient>('Client').updateOne({ _id: doc._id }, { loyaltyTier: nextTier })
  }
})

clientSchema.virtual('interventionCount', {
  ref: 'Repair',
  localField: '_id',
  foreignField: 'clientId',
  count: true,
})

clientSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

clientSchema.plugin(paginate as typeof mongoosePaginate)

export const Client = mongoose.model<IClient>('Client', clientSchema)
