import type { Types } from 'mongoose'

export type PaginationMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type GarageScope = {
  garageId: Types.ObjectId
}
