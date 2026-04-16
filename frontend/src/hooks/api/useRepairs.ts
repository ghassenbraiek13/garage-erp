import { useQuery } from '@tanstack/react-query'
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
