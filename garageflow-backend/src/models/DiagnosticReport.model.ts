import mongoose, { Schema } from 'mongoose'
import type mongoosePaginate from 'mongoose-paginate-v2'
import paginate from 'mongoose-paginate-v2'

export interface IDiagnosticReport {
  garageId: mongoose.Types.ObjectId
  repairId?: mongoose.Types.ObjectId | null
  appointmentId?: mongoose.Types.ObjectId | null
  vehicleId: mongoose.Types.ObjectId
  clientId: mongoose.Types.ObjectId
  mechanicId: mongoose.Types.ObjectId
  serviceId: mongoose.Types.ObjectId
  title: string
  findings: string
  recommendations: string
  clientSummary: string
  internalNotes?: string
  status: 'draft' | 'finalized'
  visibleToClient: boolean
  finalizedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const diagnosticReportSchema = new Schema<IDiagnosticReport>(
  {
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', required: true },
    repairId: { type: Schema.Types.ObjectId, ref: 'Repair', default: null },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', default: null },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    mechanicId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    title: { type: String, required: true },
    findings: { type: String, required: true },
    recommendations: { type: String, required: true },
    clientSummary: { type: String, required: true },
    internalNotes: String,
    status: { type: String, enum: ['draft', 'finalized'], default: 'draft' },
    visibleToClient: { type: Boolean, default: true },
    finalizedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

diagnosticReportSchema.index({ garageId: 1, clientId: 1 })
diagnosticReportSchema.index({ repairId: 1 })
diagnosticReportSchema.index({ status: 1 })

diagnosticReportSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

diagnosticReportSchema.plugin(paginate as typeof mongoosePaginate)

export const DiagnosticReport = mongoose.model<IDiagnosticReport>(
  'DiagnosticReport',
  diagnosticReportSchema,
)
