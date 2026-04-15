import mongoose, { Schema } from 'mongoose'
import type mongoosePaginate from 'mongoose-paginate-v2'
import paginate from 'mongoose-paginate-v2'

export interface ITask {
  garageId: mongoose.Types.ObjectId
  title: string
  description?: string
  assigneeId?: mongoose.Types.ObjectId | null
  vehicleId?: mongoose.Types.ObjectId | null
  repairId?: mongoose.Types.ObjectId | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'done'
  dueDate?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const taskSchema = new Schema<ITask>(
  {
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', required: true },
    title: { type: String, required: true },
    description: String,
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    repairId: { type: Schema.Types.ObjectId, ref: 'Repair', default: null },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
    },
    dueDate: Date,
    completedAt: Date,
  },
  { timestamps: true },
)

taskSchema.index({ garageId: 1 })
taskSchema.index({ status: 1 })
taskSchema.index({ assigneeId: 1 })

taskSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

taskSchema.plugin(paginate as typeof mongoosePaginate)

export const Task = mongoose.model<ITask>('Task', taskSchema)
