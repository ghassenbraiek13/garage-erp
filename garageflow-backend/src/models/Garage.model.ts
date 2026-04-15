import mongoose, { Schema } from 'mongoose'
import type mongoosePaginate from 'mongoose-paginate-v2'
import paginate from 'mongoose-paginate-v2'
import { slugify } from '@/utils/slugify'

export interface IGarage {
  name: string
  slug: string
  address: {
    street?: string
    city?: string
    postalCode?: string
    country?: string
  }
  phone?: string
  email?: string
  logo?: string
  subscriptionTier: 'trial' | 'basic' | 'pro' | 'enterprise'
  subscriptionStatus: 'active' | 'suspended' | 'cancelled'
  subscriptionExpiresAt?: Date
  settings: {
    currency: string
    timezone: string
    language: string
    tvaRate: number
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const garageSchema = new Schema<IGarage>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true },
    address: {
      street: String,
      city: String,
      postalCode: String,
      country: { type: String, default: 'France' },
    },
    phone: String,
    email: String,
    logo: String,
    subscriptionTier: {
      type: String,
      enum: ['trial', 'basic', 'pro', 'enterprise'],
      default: 'trial',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'suspended', 'cancelled'],
      default: 'active',
    },
    subscriptionExpiresAt: Date,
    settings: {
      currency: { type: String, default: 'EUR' },
      timezone: { type: String, default: 'Europe/Paris' },
      language: { type: String, default: 'fr' },
      tvaRate: { type: Number, default: 20 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

garageSchema.index({ slug: 1 }, { unique: true })
garageSchema.index({ subscriptionStatus: 1 })

garageSchema.pre('save', function preSave(next) {
  if (this.isModified('name') || !this.slug) {
    const base = slugify(this.name)
    this.slug = base || `garage-${this._id?.toString().slice(-6)}`
  }
  next()
})

garageSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

garageSchema.plugin(paginate as typeof mongoosePaginate)

export const Garage = mongoose.model<IGarage>('Garage', garageSchema)
