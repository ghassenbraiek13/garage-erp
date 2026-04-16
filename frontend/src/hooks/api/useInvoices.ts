import { useQuery } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'

export type ApiInvoice = {
  id: string
  number?: string
  clientId: string
  status: string
  totalTTC?: number
  issuedAt?: string
}

function mapInv(raw: Record<string, unknown>): ApiInvoice {
  return { ...(raw as unknown as ApiInvoice), id: String(raw.id ?? raw._id ?? '') }
}

export function useInvoicesList(status?: string) {
  return useQuery({
    queryKey: ['invoices', 'list', status],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/invoices', {
        params: { status, limit: 100, page: 1 },
      })
      return { items: data.data.map(mapInv), meta: data.meta }
    },
  })
}
