import mongoose, { Schema } from 'mongoose'
import type mongoosePaginate from 'mongoose-paginate-v2'
import paginate from 'mongoose-paginate-v2'

export interface IPart {
  garageId: mongoose.Types.ObjectId
  reference: string
  name: string
  category:
    | 'filtres'
    | 'freins'
    | 'huiles'
    | 'pneumatiques'
    | 'electricite'
    | 'carrosserie'
    | 'moteur'
    | 'transmission'
    | 'suspension'
    | 'autre'
  description?: string
  price: number
  purchasePrice?: number
  stock: number
  minStock: number
  supplier?: string
  compatibleVehicles: string[]
  photos: string[]
  isPublic: boolean
  barcode?: string
  createdAt: Date
  updatedAt: Date
}

const partSchema = new Schema<IPart>(
  {
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', required: true },
    reference: { type: String, required: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'filtres',
        'freins',
        'huiles',
        'pneumatiques',
        'electricite',
        'carrosserie',
        'moteur',
        'transmission',
        'suspension',
        'autre',
      ],
    },
    description: String,
    price: { type: Number, required: true, min: 0 },
    purchasePrice: Number,
    stock: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 5 },
    supplier: String,
    compatibleVehicles: [{ type: String }],
    photos: [{ type: String }],
    isPublic: { type: Boolean, default: false },
    barcode: String,
  },
  { timestamps: true, toJSON: { virtuals: true } },
)

partSchema.index({ garageId: 1 })
partSchema.index({ reference: 1 })
partSchema.index({ isPublic: 1 })

partSchema.virtual('isLowStock').get(function getLow(this: IPart) {
  return this.stock < this.minStock
})

partSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

partSchema.plugin(paginate as typeof mongoosePaginate)

export const Part = mongoose.model<IPart>('Part', partSchema)
