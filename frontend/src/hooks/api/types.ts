export type ApiMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type ApiListResponse<T> = {
  success: boolean
  data: T[]
  meta?: ApiMeta
}
