import mongoose, { Schema } from 'mongoose'
import type mongoosePaginate from 'mongoose-paginate-v2'
import paginate from 'mongoose-paginate-v2'
import { generateInvoiceNumber } from '@/utils/generateCode'
import { Client } from './Client.model'
import type { IQuoteLine } from './Quote.model'

export interface IInvoice {
  number: string
  garageId: mongoose.Types.ObjectId
  clientId: mongoose.Types.ObjectId
  vehicleId?: mongoose.Types.ObjectId | null
  quoteId?: mongoose.Types.ObjectId | null
  repairId?: mongoose.Types.ObjectId | null
  lines: IQuoteLine[]
  subtotalHT: number
  totalTVA: number
  totalDiscount: number
  totalTTC: number
  status: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled'
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'cheque'
  paidAt?: Date
  dueDate?: Date
  notes?: string
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

function computeLine(line: IQuoteLine): void {
  const qty = line.quantity
  const unit = line.unitPrice
  const discPct = line.discount ?? 0
  const tvaPct = line.tva ?? 20
  const lineHt = qty * unit * (1 - discPct / 100)
  line.totalHT = Math.round(lineHt * 100) / 100
  line.totalTTC = Math.round(lineHt * (1 + tvaPct / 100) * 100) / 100
}

const invoiceSchema = new Schema<IInvoice>(
  {
    number: { type: String, unique: true, sparse: true },
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    quoteId: { type: Schema.Types.ObjectId, ref: 'Quote' },
    repairId: { type: Schema.Types.ObjectId, ref: 'Repair' },
    lines: { type: [lineSchema], default: [] },
    subtotalHT: { type: Number, default: 0 },
    totalTVA: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'overdue', 'cancelled'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'transfer', 'cheque'],
    },
    paidAt: Date,
    dueDate: Date,
    notes: String,
  },
  { timestamps: true },
)

invoiceSchema.pre('save', async function preSave(next) {
  const doc = this as mongoose.HydratedDocument<IInvoice>
  if (doc.lines?.length) {
    let subtotalHT = 0
    let totalTVA = 0
    let totalDiscount = 0
    for (const line of doc.lines) {
      computeLine(line)
      const qty = line.quantity
      const unit = line.unitPrice
      const discPct = line.discount ?? 0
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
    const count = await mongoose.model<IInvoice>('Invoice').countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      },
    })
    doc.number = generateInvoiceNumber(year, count + 1)
  }
  next()
})

type InvLocals = mongoose.Document & { $locals?: { prevStatus?: string } }

invoiceSchema.pre('save', async function preStatus(next) {
  const doc = this as InvLocals
  doc.$locals = doc.$locals ?? {}
  if (doc.isModified('status') && !doc.isNew) {
    const ex = await mongoose.model<IInvoice>('Invoice').findById(doc._id).select('status').lean()
    doc.$locals.prevStatus = ex?.status
  }
  next()
})

invoiceSchema.post('save', async function postSave(doc) {
  const prev = (doc as InvLocals).$locals?.prevStatus
  if (doc.status !== 'paid') return
  const becamePaid =
    (doc as mongoose.Document).isNew || (prev !== undefined && prev !== 'paid')
  if (!becamePaid) return
  const euros = Math.floor(doc.totalTTC)
  await Client.updateOne(
    { _id: doc.clientId },
    {
      $inc: { loyaltyPoints: euros, totalSpent: doc.totalTTC },
    },
  )
})

invoiceSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

invoiceSchema.plugin(paginate as typeof mongoosePaginate)

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema)
