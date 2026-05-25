import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'

export type ApiRepair = {
  id: string
  vehicleId: unknown
  clientId: unknown
  mechanicId?: unknown
  status: string
  priority?: string
  startDate?: string
  endDate?: string
  notes?: string
  diagnosis?: string
  invoiceId?: unknown
}

function mapRepair(raw: Record<string, unknown>): ApiRepair {
  return {
    ...(raw as unknown as ApiRepair),
    id: String(raw.id ?? raw._id ?? ''),
  }
}

export function useRepairsList(params?: { status?: string; mechanicId?: string; vehicleId?: string }) {
  return useQuery({
    queryKey: ['repairs', 'list', params],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/repairs', {
        params: { ...params, limit: 100, page: 1 },
      })
      return { items: data.data.map(mapRepair), meta: data.meta }
    },
  })
}

export function useRepair(id: string | undefined) {
  return useQuery({
    queryKey: ['repairs', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown> }>(`/repairs/${id}`)
      return mapRepair(data.data)
    },
  })
}

export function useUpdateRepair() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const { data } = await api.put<{ data: Record<string, unknown> }>(`/repairs/${id}`, body)
      return mapRepair(data.data)
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['repairs'] })
      void qc.invalidateQueries({ queryKey: ['repairs', 'detail', vars.id] })
    },
  })
}
