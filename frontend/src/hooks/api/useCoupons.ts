import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'

export type ApiCoupon = {
  id: string
  garageId?: string
  clientId?: string | null
  code: string
  type: string
  value?: number
  minSpend?: number
  maxUses?: number | null
  usedCount?: number
  expiresAt?: string
  isActive?: boolean
  isUsed?: boolean
  usedAt?: string
  usedOnQuoteId?: string
}

function mapCoupon(raw: Record<string, unknown>): ApiCoupon {
  return { ...(raw as unknown as ApiCoupon), id: String(raw.id ?? raw._id ?? '') }
}

export function useCouponsList() {
  return useQuery({
    queryKey: ['coupons', 'list'],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/coupons', {
        params: { limit: 100, page: 1 },
      })
      return { items: data.data.map(mapCoupon), meta: data.meta }
    },
  })
}

export function useCreateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      code?: string
      type: 'percentage' | 'fixed' | 'free_service'
      value: number
      minSpend?: number
      expiresAt?: string
      clientId?: string | null
      maxUses?: number | null
    }) => {
      const payload = {
        ...body,
        expiresAt: body.expiresAt
          ? new Date(body.expiresAt).toISOString()
          : undefined,
      }
      const { data } = await api.post('/coupons', payload)
      return mapCoupon(data.data as Record<string, unknown>)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['coupons'] })
      void qc.invalidateQueries({ queryKey: ['loyalty'] })
    },
  })
}

export function useUpdateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<ApiCoupon> }) => {
      const { data } = await api.put(`/coupons/${id}`, body)
      return mapCoupon(data.data as Record<string, unknown>)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['coupons'] })
    },
  })
}

export function useDeleteCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/coupons/${id}`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['coupons'] })
      void qc.invalidateQueries({ queryKey: ['loyalty'] })
    },
  })
}
