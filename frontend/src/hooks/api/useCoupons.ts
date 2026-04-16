import { useQuery } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'

export type ApiCoupon = {
  id: string
  code: string
  type: string
  value?: number
  minSpend?: number
  maxUses?: number | null
  usedCount?: number
  expiresAt?: string
  isActive?: boolean
}

function mapCoupon(raw: Record<string, unknown>): ApiCoupon {
  return { ...(raw as unknown as ApiCoupon), id: String(raw.id ?? raw._id ?? '') }
}

export function useCouponsList() {
  return useQuery({
    queryKey: ['coupons', 'list'],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/coupons', { params: { limit: 100, page: 1 } })
      return { items: data.data.map(mapCoupon), meta: data.meta }
    },
  })
}
