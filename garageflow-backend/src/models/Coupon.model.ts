import mongoose, { Schema } from 'mongoose'
import type mongoosePaginate from 'mongoose-paginate-v2'
import paginate from 'mongoose-paginate-v2'

export interface ICoupon {
  garageId: mongoose.Types.ObjectId
  code: string
  type: 'percentage' | 'fixed' | 'free_service'
  value?: number
  minSpend: number
  maxUses: number | null
  usedCount: number
  clientId?: mongoose.Types.ObjectId | null
  expiresAt?: Date
  isActive: boolean
  qrCode?: string
  createdAt: Date
  updatedAt: Date
}

const couponSchema = new Schema<ICoupon>(
  {
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', required: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'free_service'],
      required: true,
    },
    value: Number,
    minSpend: { type: Number, default: 0 },
    maxUses: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
    qrCode: String,
  },
  { timestamps: true },
)

couponSchema.index({ garageId: 1, code: 1 }, { unique: true })
couponSchema.index({ isActive: 1 })

couponSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

couponSchema.plugin(paginate as typeof mongoosePaginate)

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema)
