import type { PaginationMeta } from '@/types'

export function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const sort = (query.sort as string) || 'createdAt'
  const order = (query.order as string) === 'asc' ? 1 : -1
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  return { page, limit, sort, order, search }
}

export function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}
