import mongoose, { Schema } from 'mongoose'
import type mongoosePaginate from 'mongoose-paginate-v2'
import paginate from 'mongoose-paginate-v2'

export type DiagnosticKind = 'general' | 'purchase_consultation' | 'purchase_general'

export interface IService {
  garageId: mongoose.Types.ObjectId
  name: string
  category:
    | 'lavage'
    | 'vidange'
    | 'freinage'
    | 'diagnostic'
    | 'pneumatique'
    | 'carrosserie'
    | 'electricite'
    | 'climatisation'
    | 'autre'
  description?: string
  /** Sous-type pour les prestations de la catégorie diagnostic */
  diagnosticKind?: DiagnosticKind | null
  price: number
  duration: number
  isActive: boolean
  isCustom: boolean
  createdAt: Date
  updatedAt: Date
}

const serviceSchema = new Schema<IService>(
  {
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', required: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'lavage',
        'vidange',
        'freinage',
        'diagnostic',
        'pneumatique',
        'carrosserie',
        'electricite',
        'climatisation',
        'autre',
      ],
      required: true,
    },
    description: String,
    diagnosticKind: {
      type: String,
      enum: ['general', 'purchase_consultation', 'purchase_general'],
      default: null,
    },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    isCustom: { type: Boolean, default: false },
  },
  { timestamps: true },
)

serviceSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

serviceSchema.plugin(paginate as typeof mongoosePaginate)

export const Service = mongoose.model<IService>('Service', serviceSchema)
