import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import api from '@/utils/api'

export type DashboardStats = {
  clients: { total: number; thisMonth: number; growth: number }
  repairs: { inProgress: number; completedThisMonth: number }
  revenue: { thisMonth: number; lastMonth: number; growth: number }
  quotes: { pending: number; total: number }
  revenueChart: { month: string; revenue: number }[]
  upcomingAppointments: unknown[]
  recentRepairs: unknown[]
  lowStockParts: unknown[]
}

/** Stats garage : le super-admin utilise le tableau de bord /super-admin, pas /dashboard. */
export function useDashboardStats() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['dashboard', 'stats', user?.garageId],
    enabled: !!user && user.role !== 'superadmin',
    queryFn: async () => {
      const { data } = await api.get<{ data: DashboardStats }>('/dashboard/stats')
      return data.data
    },
  })
}
