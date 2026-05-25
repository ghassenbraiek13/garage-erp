import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'

export type ServiceCategory =
  | 'lavage'
  | 'vidange'
  | 'freinage'
  | 'diagnostic'
  | 'pneumatique'
  | 'carrosserie'
  | 'electricite'
  | 'climatisation'
  | 'autre'

export type DiagnosticKind = 'general' | 'purchase_consultation' | 'purchase_general'

export type ApiService = {
  id: string
  name: string
  category?: ServiceCategory
  diagnosticKind?: DiagnosticKind | null
  description?: string
  price?: number
  duration?: number
  isActive?: boolean
  isCustom?: boolean
}

function mapService(raw: Record<string, unknown>): ApiService {
  return {
    ...(raw as unknown as ApiService),
    id: String(raw.id ?? raw._id ?? ''),
    duration: raw.duration !== undefined ? Number(raw.duration) : undefined,
    price: raw.price !== undefined ? Number(raw.price) : undefined,
    isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : true,
    isCustom: raw.isCustom !== undefined ? Boolean(raw.isCustom) : false,
  }
}

export type ServicesListParams = {
  search?: string
  category?: string
  isActive?: 'true' | 'false' | 'all'
}

export function useServicesCatalog(page = 1, limit = 200, params?: ServicesListParams) {
  return useQuery({
    queryKey: ['services', 'catalog', page, limit, params],
    queryFn: async () => {
      const queryParams: Record<string, string | number | undefined> = {
        page,
        limit,
        search: params?.search || undefined,
        category: params?.category || undefined,
      }
      if (params?.isActive === 'true') queryParams.isActive = 'true'
      else if (params?.isActive === 'false') queryParams.isActive = 'false'
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/services', {
        params: queryParams,
      })
      return { items: data.data.map(mapService), meta: data.meta }
    },
  })
}

export function useServicesList(
  page = 1,
  limit = 200,
  params?: { category?: string; diagnosticKind?: string },
) {
  return useServicesCatalog(page, limit, { ...params, isActive: 'true' })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      name: string
      category: ServiceCategory
      description?: string
      price: number
      duration: number
      isActive?: boolean
      isCustom?: boolean
    }) => {
      const { data } = await api.post<{ data: Record<string, unknown> }>('/services', body)
      return mapService(data.data)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string
      body: Partial<{
        name: string
        category: ServiceCategory
        description?: string
        price: number
        duration: number
        isActive: boolean
        isCustom: boolean
      }>
    }) => {
      const { data } = await api.put<{ data: Record<string, unknown> }>(`/services/${id}`, body)
      return mapService(data.data)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/services/${id}`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function isDuplicateServiceError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 409
}
