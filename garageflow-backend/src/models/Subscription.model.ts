import mongoose, { Schema } from 'mongoose'

/** Audit / history of subscription changes (optional; garage remains source of truth). */
export interface ISubscription {
  garageId: mongoose.Types.ObjectId
  tier: 'trial' | 'basic' | 'pro' | 'enterprise'
  status: 'active' | 'suspended' | 'cancelled'
  expiresAt?: Date
  notes?: string
  createdAt: Date
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', required: true },
    tier: {
      type: String,
      enum: ['trial', 'basic', 'pro', 'enterprise'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'cancelled'],
      required: true,
    },
    expiresAt: Date,
    notes: String,
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
)

subscriptionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema)
