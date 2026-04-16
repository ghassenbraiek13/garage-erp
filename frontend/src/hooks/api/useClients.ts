import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'

export type ApiClient = {
  id: string
  name: string
  phone: string
  email?: string
  address?: { street?: string; city?: string; postalCode?: string }
  loyaltyPoints?: number
  loyaltyTier?: string
  vehicleIds?: string[]
  totalSpent?: number
  createdAt?: string
  updatedAt?: string
}

function mapClient(raw: Record<string, unknown>): ApiClient {
  const id = String(raw.id ?? raw._id ?? '')
  const vids = raw.vehicleIds
  return {
    ...(raw as unknown as ApiClient),
    id,
    vehicleIds: Array.isArray(vids) ? vids.map((x) => String(x)) : [],
  }
}

export function useClientsList(search?: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['clients', 'list', search, page, limit],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/clients', {
        params: { search: search || undefined, page, limit },
      })
      return { items: data.data.map(mapClient), meta: data.meta }
    },
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      name: string
      phone: string
      email?: string
      address?: { street: string; city: string; postalCode: string }
      notes?: string
    }) => {
      const { data } = await api.post('/clients', body)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clients/${id}`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useCreateClientPortal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (opts: { clientId: string; password?: string; sendEmail?: boolean }) => {
      const { data } = await api.post<{ data: { user: unknown; tempPassword: string } }>(
        `/clients/${opts.clientId}/portal-access`,
        { password: opts.password, sendEmail: opts.sendEmail },
      )
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['clients'] })
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useRemoveClientPortal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (clientId: string) => {
      await api.delete(`/clients/${clientId}/portal-access`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['clients'] })
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
