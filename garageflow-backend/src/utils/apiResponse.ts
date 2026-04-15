import type { PaginationMeta } from '@/types'

export function ok<T>(data: T, meta?: PaginationMeta) {
  return meta ? { success: true as const, data, meta } : { success: true as const, data }
}

export function fail(message: string, code?: string, errors?: Record<string, string[]>) {
  return { success: false as const, message, ...(code ? { code } : {}), ...(errors ? { errors } : {}) }
}
