import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose'
import argon2 from 'argon2'
const ARGON = { memoryCost: 65536, timeCost: 3, parallelism: 4 } as const

export type UserRole = 'superadmin' | 'manager' | 'mechanic' | 'cashier' | 'client'

export interface IUser {
  email: string
  password: string
  name: string
  role: UserRole
  garageId?: mongoose.Types.ObjectId | null
  clientId?: mongoose.Types.ObjectId | null
  avatar?: string
  isActive: boolean
  lastLogin?: Date
  refreshTokens: { token: string; createdAt: Date }[]
  passwordResetOtpHash?: string | null
  passwordResetOtpExpires?: Date | null
  createdAt: Date
  updatedAt: Date
}

type UserMethods = {
  comparePassword(plain: string): Promise<boolean>
}

type UserStatics = {
  findByEmail(email: string): Promise<HydratedDocument<IUser, UserMethods> | null>
}

export type UserDocument = HydratedDocument<IUser, UserMethods>

const refreshTokenSchema = new Schema(
  {
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const userSchema = new Schema<IUser, Model<IUser, object, UserMethods> & UserStatics>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['superadmin', 'manager', 'mechanic', 'cashier', 'client'],
      required: true,
    },
    garageId: { type: Schema.Types.ObjectId, ref: 'Garage', default: null },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
    passwordResetOtpHash: { type: String, select: false, default: null },
    passwordResetOtpExpires: { type: Date, select: false, default: null },
  },
  { timestamps: true },
)

userSchema.index({ garageId: 1 })

userSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next()
  this.password = await argon2.hash(this.password, ARGON)
  next()
})

userSchema.methods.comparePassword = async function comparePassword(plain: string) {
  return argon2.verify(this.password, plain)
}

userSchema.statics.findByEmail = function findByEmail(email: string) {
  return this.findOne({ email: email.toLowerCase().trim() }).select('+password +passwordResetOtpHash +passwordResetOtpExpires')
}

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    if (ret._id) ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    delete ret.password
    delete ret.refreshTokens
    delete ret.passwordResetOtpHash
    delete ret.passwordResetOtpExpires
    return ret
  },
})

export const User = mongoose.model<IUser, Model<IUser, object, UserMethods> & UserStatics>('User', userSchema)
