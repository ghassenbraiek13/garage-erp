import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'
import type { ApiQuoteLine } from '@/hooks/api/useQuotes'

export type ApiInvoice = {
  id: string
  number?: string
  clientId: unknown
  vehicleId?: unknown
  quoteId?: unknown
  repairId?: unknown
  status: string
  lines?: ApiQuoteLine[]
  subtotalHT?: number
  totalTVA?: number
  totalDiscount?: number
  totalTTC?: number
  dueDate?: string
  paidAt?: string
  paymentMethod?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

function mapInv(raw: Record<string, unknown>): ApiInvoice {
  return {
    ...(raw as unknown as ApiInvoice),
    id: String(raw.id ?? raw._id ?? ''),
  }
}

export function useInvoicesList(status?: string) {
  return useQuery({
    queryKey: ['invoices', 'list', status],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/invoices', {
        params: { status, limit: 200, page: 1 },
      })
      return { items: data.data.map(mapInv), meta: data.meta }
    },
  })
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoices', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown> }>(`/invoices/${id}`)
      return mapInv(data.data)
    },
  })
}

export function usePayInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      paymentMethod,
    }: {
      id: string
      paymentMethod: 'cash' | 'card' | 'transfer' | 'cheque'
    }) => {
      const { data } = await api.patch(`/invoices/${id}/pay`, { paymentMethod })
      return mapInv(data.data as Record<string, unknown>)
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['invoices'] })
      void qc.invalidateQueries({ queryKey: ['invoices', 'detail', vars.id] })
    },
  })
}

export type PortalInvoice = {
  id: string
  number: string
  status: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled'
  totalTTC: number
  subtotalHT: number
  dueDate?: string
  paidAt?: string
  paymentMethod?: string
  createdAt: string
  lines: ApiQuoteLine[]
  vehicleInfo?: { plate: string; make: string; model: string }
}

export function usePortalInvoices() {
  return useQuery({
    queryKey: ['portal', 'invoices'],
    queryFn: async () => {
      const { data } = await api.get<{ data: PortalInvoice[] }>('/invoices/portal/my')
      return data.data
    },
  })
}

export function useSendInvoiceEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/invoices/${id}/send-email`)
      return data.data
    },
    onSuccess: (_d, id) => {
      void qc.invalidateQueries({ queryKey: ['invoices'] })
      void qc.invalidateQueries({ queryKey: ['invoices', 'detail', id] })
    },
  })
}
