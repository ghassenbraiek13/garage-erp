import mongoose, { Schema } from 'mongoose'
import type mongoosePaginate from 'mongoose-paginate-v2'
import paginate from 'mongoose-paginate-v2'

export interface INotification {
  garageId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type:
    | 'repair_status'
    | 'appointment_reminder'
    | 'low_stock'
    | 'quote_accepted'
    | 'payment_received'
    | 'new_client'
    | 'task_assigned'
  title?: string
  message?: string
  link?: string
  isRead: boolean
  data?: Record<string, unknown>
  createdAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'repair_status',
        'appointment_reminder',
        'low_stock',
        'quote_accepted',
        'payment_received',
        'new_client',
        'task_assigned',
      ],
      required: true,
    },
    title: String,
    message: String,
    link: String,
    isRead: { type: Boolean, default: false },
    data: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
)

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })

notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

notificationSchema.plugin(paginate as typeof mongoosePaginate)

export const Notification = mongoose.model<INotification>('Notification', notificationSchema)
