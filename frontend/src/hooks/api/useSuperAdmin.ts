import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'

export type ApiGarage = {
  id: string
  name: string
  slug?: string
  address?: { city?: string; street?: string; postalCode?: string }
  subscriptionTier?: string
  subscriptionStatus?: string
  phone?: string
  email?: string
  createdAt?: string
}

function mapGarage(raw: Record<string, unknown>): ApiGarage {
  return { ...(raw as unknown as ApiGarage), id: String(raw.id ?? raw._id ?? '') }
}

export function useSuperAdminGarages(search?: string, page = 1) {
  return useQuery({
    queryKey: ['superadmin', 'garages', search, page],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/superadmin/garages', {
        params: { search, page, limit: 50 },
      })
      return { items: data.data.map(mapGarage), meta: data.meta }
    },
  })
}

export function useSuperAdminStats() {
  return useQuery({
    queryKey: ['superadmin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown> }>('/superadmin/stats')
      return data.data
    },
  })
}

export type ApiSuperUser = {
  id: string
  name: string
  email: string
  role: string
  garageId?: string
  isActive?: boolean
  lastLogin?: string
}

function mapSuperUser(raw: Record<string, unknown>): ApiSuperUser {
  return { ...(raw as unknown as ApiSuperUser), id: String(raw._id ?? raw.id ?? '') }
}

export function useSuperAdminUsers(page = 1) {
  return useQuery({
    queryKey: ['superadmin', 'users', page],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/superadmin/users', { params: { page, limit: 50 } })
      return { items: data.data.map(mapSuperUser), meta: data.meta }
    },
  })
}

export type ApiSubscriptionRow = {
  id: string
  name: string
  subscriptionTier?: string
  subscriptionStatus?: string
  subscriptionExpiresAt?: string
}

function mapSubGarage(raw: Record<string, unknown>): ApiSubscriptionRow {
  return {
    id: String(raw._id ?? raw.id ?? ''),
    name: String(raw.name ?? ''),
    subscriptionTier: raw.subscriptionTier as string | undefined,
    subscriptionStatus: raw.subscriptionStatus as string | undefined,
    subscriptionExpiresAt: raw.subscriptionExpiresAt ? String(raw.subscriptionExpiresAt) : undefined,
  }
}

export function useSuperAdminSubscriptions() {
  return useQuery({
    queryKey: ['superadmin', 'subscriptions'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown>[] }>('/superadmin/subscriptions')
      return data.data.map(mapSubGarage)
    },
  })
}

export function useSuperAdminActivity() {
  return useQuery({
    queryKey: ['superadmin', 'activity'],
    queryFn: async () => {
      const { data } = await api.get<{ data: unknown[] }>('/superadmin/activity')
      return data.data
    },
  })
}

export function useSuspendGarage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await api.patch(`/superadmin/garages/${id}/suspend`, { reason })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['superadmin'] })
    },
  })
}
