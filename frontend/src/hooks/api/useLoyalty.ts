import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'

export type LoyaltyHistory = {
  date: string
  pointsGagnes: number
  motif: string
  factureId?: string
}

export type LoyaltyCoupon = {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minSpend: number
  expiresAt: string
  isUsed: boolean
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export type LoyaltyInfo = {
  points: number
  tier: LoyaltyTier
  totalSpent: number
  history: LoyaltyHistory[]
  coupons: LoyaltyCoupon[]
}

export type GarageLoyaltyStats = {
  totalClients: number
  totalPoints: number
  activeCoupons: number
  usedCoupons: number
  clients: Array<{
    id: string
    name: string
    loyaltyPoints: number
    loyaltyTier: string
    totalSpent: number
  }>
}

function mapCoupon(raw: Record<string, unknown>): LoyaltyCoupon {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    code: String(raw.code ?? ''),
    type: (raw.type as LoyaltyCoupon['type']) ?? 'percentage',
    value: Number(raw.value ?? 0),
    minSpend: Number(raw.minSpend ?? 0),
    expiresAt: raw.expiresAt ? String(raw.expiresAt) : '',
    isUsed: Boolean(raw.isUsed),
  }
}

function mapHistory(raw: Record<string, unknown>): LoyaltyHistory {
  return {
    date: String(raw.date ?? ''),
    pointsGagnes: Number(raw.pointsGagnes ?? 0),
    motif: String(raw.motif ?? ''),
    factureId: raw.factureId ? String(raw.factureId) : undefined,
  }
}

function mapLoyaltyInfo(raw: Record<string, unknown>): LoyaltyInfo {
  const tier = String(raw.tier ?? 'bronze').toLowerCase() as LoyaltyTier
  const coupons = Array.isArray(raw.coupons)
    ? (raw.coupons as Record<string, unknown>[]).map(mapCoupon).filter((c) => !c.isUsed)
    : []
  const history = Array.isArray(raw.history)
    ? (raw.history as Record<string, unknown>[]).map(mapHistory)
    : []

  return {
    points: Number(raw.points ?? 0),
    tier: ['bronze', 'silver', 'gold', 'platinum'].includes(tier) ? tier : 'bronze',
    totalSpent: Number(raw.totalSpent ?? 0),
    history,
    coupons,
  }
}

export function useLoyaltyInfo() {
  return useQuery({
    queryKey: ['loyalty', 'my'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown> }>('/loyalty/my')
      return mapLoyaltyInfo(data.data)
    },
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  })
}

export function useGarageLoyaltyStats() {
  return useQuery({
    queryKey: ['loyalty', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<{ data: GarageLoyaltyStats }>('/loyalty/stats')
      return data.data
    },
  })
}

export function useApplyCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { couponCode: string; quoteId: string }) => {
      const { data } = await api.post<{ data: { nouveauTotalTTC: number; remiseAppliquee: number } }>(
        '/loyalty/apply-coupon',
        body,
      )
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['loyalty', 'my'] })
      void qc.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}
