import { getEnv } from '@/config/env'

type VinResult = {
  make: string
  model: string
  year: number
  engine?: string
  fuelType?: 'essence' | 'diesel' | 'hybride' | 'electrique' | 'autre'
}

const cache = new Map<string, { at: number; data: VinResult & { partial?: boolean; message?: string } }>()
const DAY_MS = 24 * 60 * 60 * 1000

export async function decodeVin(vin: string): Promise<VinResult & { partial?: boolean; message?: string }> {
  const upper = vin.toUpperCase()
  const hit = cache.get(upper)
  if (hit && Date.now() - hit.at < DAY_MS) return hit.data

  const base = getEnv().NHTSA_API_URL.replace(/\/$/, '')
  const url = `${base}/decodevinvalues/${encodeURIComponent(upper)}?format=json`

  try {
    const res = await fetch(url)
    const json = (await res.json()) as {
      Results?: Array<Record<string, string>>
    }
    const row = json.Results?.[0] ?? {}
    const make = row.Make ?? ''
    const model = row.Model ?? ''
    const year = parseInt(row.ModelYear ?? '0', 10) || new Date().getFullYear()
    const engine = row.DisplacementL ? `${row.DisplacementL}L` : row.EngineModel
    const fuel = mapFuel(row.FuelTypePrimary ?? row.FuelTypeSecondary)

    const data: VinResult & { partial?: boolean; message?: string } = {
      make: make || 'Inconnu',
      model: model || 'Inconnu',
      year,
      engine,
      fuelType: fuel,
    }
    if (!make || !model) {
      data.partial = true
      data.message = 'VIN partiellement décodé'
    }
    cache.set(upper, { at: Date.now(), data })
    return data
  } catch {
    const fallback: VinResult & { partial: boolean; message: string } = {
      make: 'Inconnu',
      model: 'Inconnu',
      year: new Date().getFullYear(),
      partial: true,
      message: 'VIN partiellement décodé',
    }
    cache.set(upper, { at: Date.now(), data: fallback })
    return fallback
  }
}

function mapFuel(raw?: string): VinResult['fuelType'] {
  if (!raw) return 'autre'
  const u = raw.toLowerCase()
  if (u.includes('electric')) return 'electrique'
  if (u.includes('diesel')) return 'diesel'
  if (u.includes('hybrid')) return 'hybride'
  if (u.includes('gasoline') || u.includes('essence')) return 'essence'
  return 'autre'
}
