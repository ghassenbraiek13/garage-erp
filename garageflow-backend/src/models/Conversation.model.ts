import mongoose, { Schema } from 'mongoose'
import type mongoosePaginate from 'mongoose-paginate-v2'
import paginate from 'mongoose-paginate-v2'

export interface IMessage {
  auteur: 'client' | 'bot' | 'manager'
  contenu: string
  timestamp: Date
  type: 'bot' | 'human'
}

export interface IConversation {
  clientId: mongoose.Types.ObjectId
  garageId: mongoose.Types.ObjectId
  statut: 'open' | 'pending_human' | 'closed'
  messages: IMessage[]
  createdAt: Date
  updatedAt: Date
}

const messageSchema = new Schema<IMessage>(
  {
    auteur: { type: String, enum: ['client', 'bot', 'manager'], required: true },
    contenu: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['bot', 'human'], default: 'bot' },
  },
  { _id: false },
)

const conversationSchema = new Schema<IConversation>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', required: true },
    statut: {
      type: String,
      enum: ['open', 'pending_human', 'closed'],
      default: 'open',
    },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true },
)

conversationSchema.index({ clientId: 1 })
conversationSchema.index({ garageId: 1 })

conversationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

conversationSchema.plugin(paginate as typeof mongoosePaginate)

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema)
