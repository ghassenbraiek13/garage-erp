import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'

export type ApiAppointment = {
  id: string
  clientId: unknown
  vehicleId: unknown
  serviceId?: unknown
  mechanicId?: unknown
  start: string
  end: string
  status: string
  notes?: string
  _id?: string
}

function mapAppt(raw: Record<string, unknown>): ApiAppointment {
  return {
    ...(raw as unknown as ApiAppointment),
    id: String(raw.id ?? raw._id ?? ''),
  }
}

export function useAppointmentsList(
  range?: { start: string; end: string },
  filters?: { mechanicId?: string },
) {
  return useQuery({
    queryKey: ['appointments', 'list', range, filters],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/appointments', {
        params: {
          ...(range
            ? {
                start: range.start,
                end: range.end,
              }
            : {}),
          ...(filters?.mechanicId ? { mechanicId: filters.mechanicId } : {}),
          limit: 200,
          page: 1,
          sort: 'start',
          order: 'asc',
        },
      })
      return { items: data.data.map(mapAppt), meta: data.meta }
    },
  })
}

export function useAppointmentsUpcoming() {
  return useQuery({
    queryKey: ['appointments', 'upcoming'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown>[] }>('/appointments/upcoming')
      return data.data.map(mapAppt)
    },
  })
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/appointments/${id}/status`, { status })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export type CreateAppointmentBody = {
  clientId: string
  vehicleId: string
  serviceId?: string
  mechanicId?: string
  start: string
  end: string
  notes?: string
}

export function useCreateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateAppointmentBody) => {
      const { data } = await api.post<{ data: unknown }>('/appointments', body)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['appointments'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/appointments/${id}`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['appointments'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<CreateAppointmentBody> }) => {
      const { data } = await api.put<{ data: unknown }>(`/appointments/${id}`, body)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['appointments'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
