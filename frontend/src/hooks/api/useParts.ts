import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'

export type ApiPart = {
  id: string
  reference: string
  name: string
  category?: string
  price: number
  stock: number
  minStock: number
  supplier?: string
  isPublic?: boolean
  isLowStock?: boolean
}

function mapPart(raw: Record<string, unknown>): ApiPart {
  return { ...(raw as unknown as ApiPart), id: String(raw.id ?? raw._id ?? '') }
}

export function usePartsList(params?: { category?: string; lowStock?: boolean; search?: string }) {
  return useQuery({
    queryKey: ['parts', 'list', params],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/parts', {
        params: {
          ...params,
          lowStock: params?.lowStock ? 'true' : undefined,
          limit: 200,
          page: 1,
        },
      })
      return { items: data.data.map(mapPart), meta: data.meta }
    },
  })
}

export function useCreatePart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      reference: string
      name: string
      category?: string
      price: number
      stock?: number
      minStock?: number
      supplier?: string
    }) => {
      const { data } = await api.post('/parts', body)
      return mapPart(data.data as Record<string, unknown>)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['parts'] })
    },
  })
}

export function usePartsLowStock() {
  return useQuery({
    queryKey: ['parts', 'lowStock'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown>[] }>('/parts/low-stock')
      return data.data.map(mapPart)
    },
  })
}
