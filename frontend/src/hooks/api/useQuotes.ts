import { useQuery } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'

export type ApiQuote = {
  id: string
  number?: string
  clientId: string
  vehicleId?: string
  status: string
  totalTTC?: number
  validUntil?: string
  lines?: unknown[]
}

function mapQuote(raw: Record<string, unknown>): ApiQuote {
  return { ...(raw as unknown as ApiQuote), id: String(raw.id ?? raw._id ?? '') }
}

export function useQuotesList(status?: string) {
  return useQuery({
    queryKey: ['quotes', 'list', status],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/quotes', {
        params: { status, limit: 100, page: 1 },
      })
      return { items: data.data.map(mapQuote), meta: data.meta }
    },
  })
}

export function useQuotePdfUrl(id: string | undefined) {
  const base = import.meta.env.VITE_API_URL as string
  return id ? `${base}/quotes/${id}/pdf` : ''
}
