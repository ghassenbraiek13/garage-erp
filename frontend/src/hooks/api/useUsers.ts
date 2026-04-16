import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'

export type ApiStaffUser = {
  id: string
  name: string
  email: string
  role: string
  clientId?: string
  isActive?: boolean
  lastLogin?: string
  avatar?: string
}

function mapStaff(raw: Record<string, unknown>): ApiStaffUser {
  const cid = raw.clientId
  return {
    ...(raw as unknown as ApiStaffUser),
    id: String(raw._id ?? raw.id ?? ''),
    clientId: cid ? String(cid) : undefined,
  }
}

export function useMechanics() {
  return useQuery({
    queryKey: ['users', 'mechanics'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown>[] }>('/users/mechanics')
      return data.data.map(mapStaff)
    },
  })
}

export function useGarageUsers() {
  return useQuery({
    queryKey: ['users', 'garage'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown>[] }>('/users')
      return data.data.map(mapStaff)
    },
  })
}

export function useCreateGarageUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { email: string; password: string; name: string; role: 'mechanic' | 'cashier' | 'manager' }) => {
      const { data } = await api.post('/users', body)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function usePatchUserActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/users/${id}/active`, { isActive })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
