import { useAuthStore } from '@/store/auth'
import { useClientVehicles } from '@/hooks/api/useVehicles'

export function usePortalClientId(): string | undefined {
  return useAuthStore((s) => s.user?.clientId ?? undefined)
}

export function usePortalVehicles() {
  const clientId = usePortalClientId()
  return useClientVehicles(clientId)
}
