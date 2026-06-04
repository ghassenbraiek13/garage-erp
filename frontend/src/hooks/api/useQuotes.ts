import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'
import { embedRepairIdInNotes, extractRepairIdFromNotes } from '@/lib/quoteUtils'

export type ApiQuoteLine = {
  type: 'service' | 'part'
  refId?: string
  label: string
  quantity: number
  unitPrice: number
  discount?: number
  tva?: number
  totalHT?: number
  totalTTC?: number
}

export type ApiQuote = {
  id: string
  number?: string
  clientId: unknown
  vehicleId?: unknown
  status: string
  lines?: ApiQuoteLine[]
  subtotalHT?: number
  totalTVA?: number
  totalDiscount?: number
  totalTTC?: number
  validUntil?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
  repairId?: string
}

function mapQuote(raw: Record<string, unknown>): ApiQuote {
  const notes = typeof raw.notes === 'string' ? raw.notes : undefined
  return {
    ...(raw as unknown as ApiQuote),
    id: String(raw.id ?? raw._id ?? ''),
    repairId: extractRepairIdFromNotes(notes),
  }
}

export type QuotePayload = {
  clientId: string
  vehicleId?: string
  repairId?: string
  lines: ApiQuoteLine[]
  validUntil?: string
  notes?: string
  status?: string
}

function toApiBody(payload: Partial<QuotePayload>): Record<string, unknown> {
  const { repairId, notes, ...rest } = payload
  const body: Record<string, unknown> = { ...rest }
  if (repairId !== undefined || notes !== undefined) {
    body.notes = embedRepairIdInNotes(notes, repairId)
  }
  return body
}

export function useQuotesList(status?: string) {
  return useQuery({
    queryKey: ['quotes', 'list', status],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/quotes', {
        params: { status, limit: 200, page: 1 },
      })
      return { items: data.data.map(mapQuote), meta: data.meta }
    },
  })
}

export function useQuote(id: string | undefined) {
  return useQuery({
    queryKey: ['quotes', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown> }>(`/quotes/${id}`)
      return mapQuote(data.data)
    },
  })
}

export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: QuotePayload) => {
      const { data } = await api.post('/quotes', toApiBody(payload))
      return mapQuote(data.data as Record<string, unknown>)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useUpdateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<QuotePayload> }) => {
      const { data } = await api.put(`/quotes/${id}`, toApiBody(payload))
      return mapQuote(data.data as Record<string, unknown>)
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['quotes'] })
      void qc.invalidateQueries({ queryKey: ['quotes', 'detail', vars.id] })
    },
  })
}

export function usePatchQuoteStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/quotes/${id}/status`, { status })
      return mapQuote(data.data as Record<string, unknown>)
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['quotes'] })
      void qc.invalidateQueries({ queryKey: ['quotes', 'detail', vars.id] })
    },
  })
}

export function useConvertQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, repairId }: { id: string; repairId?: string }) => {
      const { data } = await api.post<{ data: Record<string, unknown> }>(`/quotes/${id}/convert`)
      const inv = data.data
      if (repairId && inv.id) {
        await api.put(`/invoices/${String(inv.id)}`, { repairId })
      }
      return inv
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['quotes'] })
      void qc.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useDeleteQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/quotes/${id}`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export type PortalQuote = {
  id: string
  number: string
  status: 'draft' | 'sent' | 'accepted' | 'invoiced' | 'expired' | 'rejected'
  totalTTC: number
  subtotalHT: number
  totalTVA: number
  totalDiscount: number
  validUntil?: string
  createdAt: string
  notes?: string
  lines: ApiQuoteLine[]
  vehicleInfo?: { plate: string; make: string; model: string }
}

export function usePortalQuotes() {
  return useQuery({
    queryKey: ['portal', 'quotes'],
    queryFn: async () => {
      const { data } = await api.get<{ data: PortalQuote[] }>('/quotes/portal/my')
      return data.data
    },
  })
}

export function useAcceptQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<{ data: PortalQuote }>(`/quotes/portal/${id}/accept`)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['portal', 'quotes'] })
    },
  })
}

export function useRefuseQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<{ data: PortalQuote }>(`/quotes/portal/${id}/refuse`)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['portal', 'quotes'] })
    },
  })
}

export function useApplyCouponToQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, couponCode }: { id: string; couponCode: string }) => {
      const { data } = await api.post<{
        data: { nouveauTotalTTC: number; remiseAppliquee: number; couponCode: string }
      }>(`/quotes/portal/${id}/apply-coupon`, { couponCode })
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['portal', 'quotes'] })
      void qc.invalidateQueries({ queryKey: ['loyalty', 'my'] })
    },
  })
}

export function useSendQuoteEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/quotes/${id}/send-email`)
      return data.data
    },
    onSuccess: (_d, id) => {
      void qc.invalidateQueries({ queryKey: ['quotes'] })
      void qc.invalidateQueries({ queryKey: ['quotes', 'detail', id] })
    },
  })
}
