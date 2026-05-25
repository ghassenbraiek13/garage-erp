import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'

export type ApiDiagnosticReport = {
  id: string
  repairId?: string | null
  appointmentId?: string | null
  vehicleId: unknown
  clientId: unknown
  mechanicId: unknown
  serviceId: unknown
  title: string
  findings: string
  recommendations: string
  clientSummary: string
  internalNotes?: string
  status: 'draft' | 'finalized'
  visibleToClient: boolean
  finalizedAt?: string | null
  createdAt?: string
}

function mapReport(raw: Record<string, unknown>): ApiDiagnosticReport {
  return {
    ...(raw as unknown as ApiDiagnosticReport),
    id: String(raw.id ?? raw._id ?? ''),
  }
}

export function useDiagnosticReportsList(params?: {
  repairId?: string
  clientId?: string
  vehicleId?: string
  status?: string
}) {
  return useQuery({
    queryKey: ['diagnostic-reports', 'list', params],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/diagnostic-reports', {
        params: { ...params, limit: 50, page: 1 },
      })
      return { items: data.data.map(mapReport), meta: data.meta }
    },
  })
}

export function useCreateDiagnosticReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post<{ data: Record<string, unknown> }>('/diagnostic-reports', body)
      return mapReport(data.data)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['diagnostic-reports'] })
      void qc.invalidateQueries({ queryKey: ['repairs'] })
    },
  })
}

export function useUpdateDiagnosticReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.put<{ data: Record<string, unknown> }>(`/diagnostic-reports/${id}`, body)
      return mapReport(data.data)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['diagnostic-reports'] })
      void qc.invalidateQueries({ queryKey: ['repairs'] })
    },
  })
}

export function useFinalizeDiagnosticReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<{ data: Record<string, unknown> }>(
        `/diagnostic-reports/${id}/finalize`,
      )
      return mapReport(data.data)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['diagnostic-reports'] })
    },
  })
}
