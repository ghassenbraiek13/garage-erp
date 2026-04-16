import { useQuery } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'

export type ApiVehicle = {
  id: string
  clientId: string
  plate: string
  vin?: string
  make: string
  model: string
  year?: number
  mileage?: number
  fuelType?: string
}

function mapVehicle(raw: Record<string, unknown>): ApiVehicle {
  return {
    ...(raw as unknown as ApiVehicle),
    id: String(raw.id ?? raw._id ?? ''),
    clientId: String(raw.clientId ?? ''),
  }
}

export function useVehiclesList(search?: string, page = 1) {
  return useQuery({
    queryKey: ['vehicles', 'list', search, page],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/vehicles', {
        params: { search: search || undefined, page, limit: 100 },
      })
      return { items: data.data.map(mapVehicle), meta: data.meta }
    },
  })
}

export function useClientVehicles(clientId: string | undefined) {
  return useQuery({
    queryKey: ['vehicles', 'byClient', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown>[] }>(`/clients/${clientId}/vehicles`)
      return data.data.map(mapVehicle)
    },
  })
}
