import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'

export type ApiVehicle = {
  id: string
  clientId: string
  plate: string
  vin?: string
  make: string
  model: string
  year?: number
  engine?: string
  mileage?: number
  fuelType?: string
  color?: string
  transmission?: string
  bodyType?: string
  doors?: number
  power?: number
  displacement?: number
  co2?: number
  lastServiceDate?: string
}

function mapVehicle(raw: Record<string, unknown>): ApiVehicle {
  return {
    ...(raw as unknown as ApiVehicle),
    id: String(raw.id ?? raw._id ?? ''),
    clientId: String(raw.clientId ?? ''),
    transmission: raw.transmission as string | undefined,
    bodyType: raw.bodyType as string | undefined,
    doors: raw.doors as number | undefined,
    power: raw.power as number | undefined,
    displacement: raw.displacement as number | undefined,
    co2: raw.co2 as number | undefined,
  }
}

export function useVehiclesList(search?: string, page = 1) {
  return useQuery({
    queryKey: ['vehicles', 'list', search, page],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/vehicles', {
        params: { search: search || undefined, page, limit: 100 },
      })
      return { items: data.data.map(mapVehicle), meta: data.meta }
    },
  })
}

/** Liste véhicules d'un client (portail : GET /vehicles ; atelier : GET /clients/:id/vehicles). */
export function useClientVehicles(clientId: string | undefined, source: 'portal' | 'garage' = 'portal') {
  return useQuery({
    queryKey: ['vehicles', 'byClient', clientId, source],
    enabled: !!clientId,
    queryFn: async () => {
      if (source === 'garage' && clientId) {
        const { data } = await api.get<{ data: Record<string, unknown>[] }>(`/clients/${clientId}/vehicles`)
        return data.data.map(mapVehicle)
      }
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/vehicles', {
        params: { page: 1, limit: 100 },
      })
      return data.data.map(mapVehicle)
    },
  })
}

export type VinDecodeResult = {
  vin: string
  make: string
  model: string
  year: number
  fuelType: string
  engine: string
  transmission: string
  bodyType: string
  color: string
  doors: number
  power: number
  displacement: number
  co2: number
  recordType: string
  recordId: string
}

export type VinMatch = {
  id: string
  recordType: string
  make: string
  model: string
  year: number
  powerKw: number
  powerCh: number
  fuelType: string
}

/** Chemin API absolu — doit commencer par /vehicles/vin/ (évite les URLs relatives cassées). */
function vinMatchesPath(vin: string, suffix = ''): string {
  const normalized = encodeURIComponent(String(vin).trim().toUpperCase())
  return `/vehicles/vin/${normalized}${suffix}`
}

export function useDecodeVin() {
  return useMutation({
    mutationFn: async (vin: string) => {
      const { data } = await api.get<{ data: VinDecodeResult }>(vinMatchesPath(vin))
      return data.data
    },
  })
}

export async function fetchVinMatches(vin: string): Promise<VinMatch[]> {
  const path = vinMatchesPath(vin, '/matches')
  const { data } = await api.get<{ data: VinMatch[] }>(path)
  return data.data
}

export async function fetchVinDecodeWithMatch(
  vin: string,
  match: { id: string; recordType: string },
): Promise<VinDecodeResult> {
  const path = vinMatchesPath(vin)
  const { data } = await api.get<{ data: VinDecodeResult }>(path, {
    params: { matchId: match.id, matchType: match.recordType },
  })
  return data.data
}

export function useVehicleRepairs(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ['vehicles', vehicleId, 'repairs'],
    enabled: Boolean(vehicleId),
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown>[] }>(`/vehicles/${vehicleId}/repairs`)
      return data.data
    },
  })
}

export type CreateVehicleBody = {
  clientId: string
  plate: string
  make: string
  model: string
  year: number
  vin?: string
  engine?: string
  fuelType?: 'essence' | 'diesel' | 'hybride' | 'electrique' | 'autre'
  mileage?: number
  color?: string
  transmission?: string
  bodyType?: string
  doors?: number
  power?: number
  displacement?: number
  co2?: number
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: ['vehicles', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown> }>(`/vehicles/${id}`)
      return mapVehicle(data.data)
    },
  })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateVehicleBody) => {
      const { data } = await api.post<{ data: Record<string, unknown> }>('/vehicles', body)
      return mapVehicle(data.data as Record<string, unknown>)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export function useUpdateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string
      body: Partial<CreateVehicleBody> & {
        transmission?: string
        bodyType?: string
        doors?: number
        power?: number
        displacement?: number
        co2?: number
      }
    }) => {
      const { data } = await api.put<{ data: Record<string, unknown> }>(`/vehicles/${id}`, body)
      return mapVehicle(data.data)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}
