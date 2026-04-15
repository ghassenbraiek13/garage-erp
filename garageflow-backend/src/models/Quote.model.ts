import mongoose, { Schema } from 'mongoose'
import type mongoosePaginate from 'mongoose-paginate-v2'
import paginate from 'mongoose-paginate-v2'
import { generateQuoteNumber } from '@/utils/generateCode'

export interface IQuoteLine {
  type: 'service' | 'part'
  refId?: mongoose.Types.ObjectId
  label: string
  quantity: number
  unitPrice: number
  discount: number
  tva: number
  totalHT: number
  totalTTC: number
}

export interface IQuote {
  number: string
  garageId: mongoose.Types.ObjectId
  clientId: mongoose.Types.ObjectId
  vehicleId?: mongoose.Types.ObjectId | null
  lines: IQuoteLine[]
  subtotalHT: number
  totalTVA: number
  totalDiscount: number
  totalTTC: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'invoiced' | 'expired'
  validUntil?: Date
  notes?: string
  sentAt?: Date
  acceptedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const lineSchema = new Schema<IQuoteLine>(
  {
    type: { type: String, enum: ['service', 'part'], required: true },
    refId: { type: Schema.Types.ObjectId },
    label: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    tva: { type: Number, default: 20 },
    totalHT: { type: Number, required: true },
    totalTTC: { type: Number, required: true },
  },
  { _id: false },
)

const quoteSchema = new Schema<IQuote>(
  {
    number: { type: String, unique: true, sparse: true },
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    lines: { type: [lineSchema], default: [] },
    subtotalHT: { type: Number, default: 0 },
    totalTVA: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'invoiced', 'expired'],
      default: 'draft',
    },
    validUntil: Date,
    notes: String,
    sentAt: Date,
    acceptedAt: Date,
  },
  { timestamps: true },
)

function computeLine(line: IQuoteLine): void {
  const qty = line.quantity
  const unit = line.unitPrice
  const discPct = line.discount ?? 0
  const tvaPct = line.tva ?? 20
  const lineHt = qty * unit * (1 - discPct / 100)
  line.totalHT = Math.round(lineHt * 100) / 100
  line.totalTTC = Math.round(lineHt * (1 + tvaPct / 100) * 100) / 100
}

quoteSchema.pre('save', async function preSave(next) {
  const doc = this as mongoose.HydratedDocument<IQuote>
  if (doc.lines?.length) {
    let subtotalHT = 0
    let totalTVA = 0
    let totalDiscount = 0
    for (const line of doc.lines) {
      computeLine(line)
      const qty = line.quantity
      const unit = line.unitPrice
      const discPct = line.discount ?? 0
      const tvaPct = line.tva ?? 20
      const grossHt = qty * unit
      totalDiscount += Math.round((grossHt * discPct) / 100 * 100) / 100
      subtotalHT += line.totalHT
      totalTVA += Math.round((line.totalTTC - line.totalHT) * 100) / 100
    }
    doc.subtotalHT = Math.round(subtotalHT * 100) / 100
    doc.totalTVA = Math.round(totalTVA * 100) / 100
    doc.totalDiscount = Math.round(totalDiscount * 100) / 100
    doc.totalTTC = Math.round((doc.subtotalHT + doc.totalTVA) * 100) / 100
  }
  if (doc.isNew && !doc.number) {
    const year = new Date().getFullYear()
    const count = await mongoose.model<IQuote>('Quote').countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      },
    })
    doc.number = generateQuoteNumber(year, count + 1)
  }
  next()
})

quoteSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

quoteSchema.plugin(paginate as typeof mongoosePaginate)

export const Quote = mongoose.model<IQuote>('Quote', quoteSchema)
