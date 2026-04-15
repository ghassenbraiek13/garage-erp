import { useQuery } from '@tanstack/react-query'
import api from '@/utils/api'

export function useDashboardStats(garageId?: string | null) {
  return useQuery({
    queryKey: ['dashboard', 'stats', garageId],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats', {
        params: garageId ? { garageId } : {},
      })
      return data.data
    },
  })
}
