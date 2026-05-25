import axios from 'axios'
import { getEnv } from '@/config/env'

function autorefClient() {
  const e = getEnv()
  return axios.create({
    baseURL: e.AUTOREF_BASE_URL,
    headers: { 'x-api-key': e.AUTOREF_API_KEY },
    timeout: 10_000,
  })
}

export interface VinMatch {
  id: string
  recordType: string
  make: string
  model: string
  year: number
  powerKw: number
  powerCh: number
  fuelType: string
}

export interface VinDecodeResult {
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
  vin: string
  recordType: string
  recordId: string
}

const vinCache = new Map<string, { result: VinDecodeResult; cachedAt: number }>()
const matchesCache = new Map<string, { result: VinMatch[]; cachedAt: number }>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

function str(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function num(...vals: unknown[]): number {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v)
      if (!Number.isNaN(n)) return n
    }
  }
  return 0
}

function yearFromAutoref(val: unknown): number {
  if (!val) return 0
  const s = String(val).trim()
  const y = parseInt(s.slice(0, 4), 10)
  return !Number.isNaN(y) && y >= 1900 ? y : 0
}

function firstStr(...vals: unknown[]): string {
  for (const val of vals) {
    if (Array.isArray(val)) {
      const s = str(val[0])
      if (s) return s
    } else {
      const s = str(val)
      if (s) return s
    }
  }
  return ''
}

function recordTypeOf(v: Record<string, unknown>): string {
  return String(v.RECORD_TYPE ?? v.record_type ?? '')
}

export async function getVinMatches(vin: string): Promise<VinMatch[]> {
  const upper = vin.toUpperCase().trim()
  if (!getEnv().AUTOREF_API_KEY) throw new Error('Service VIN non configuré')

  const cached = matchesCache.get(upper)
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) return cached.result

  const autoref = autorefClient()
  const res = await autoref.get(`/vehicles/${encodeURIComponent(upper)}`, {
    params: { lang: 'fr' },
  })
  const raw = res.data as Array<Record<string, unknown>>
  if (!Array.isArray(raw) || raw.length === 0) return []

  const result: VinMatch[] = raw
    .filter((v) => v.id && recordTypeOf(v))
    .map((v) => {
      const kw = num(v.POWER_KW, v.power_kw, v.puissance_kw)
      const din = num(v.POWER_DIN, v.power_din)
      return {
        id: String(v.id),
        recordType: recordTypeOf(v),
        make: str(v.BRAND, v.brand, v.make, v.marque),
        model: str(v.BRAND_MODEL, v.MODEL, v.MODEL2, v.model, v.modele, v.variant),
        year: yearFromAutoref(v.DATE_FIRST_CIRCULATION) || num(v.year, v.annee),
        powerKw: kw,
        powerCh: din > 0 ? din : Math.round(kw * 1.36),
        fuelType: str(v.FUEL, v.fuel_type, v.carburant, v.energy),
      }
    })

  matchesCache.set(upper, { result, cachedAt: Date.now() })
  return result
}

function mapSpecToDecodeResult(
  spec: Record<string, unknown>,
  upper: string,
  resolvedType: string,
  resolvedId: string,
): VinDecodeResult {
  const vinInfo = asRecord(spec.VIN_INFO)
  const specs = asRecord(spec.SPECS)
  const emission0 = Array.isArray(spec.EMISSION) ? asRecord(spec.EMISSION[0]) : asRecord(spec.EMISSION)
  const consumption0 = Array.isArray(spec.CONSUMPTION)
    ? asRecord(spec.CONSUMPTION[0])
    : asRecord(spec.CONSUMPTION)

  const make = str(vinInfo.BRAND, spec.BRAND, spec.brand, spec.make, spec.marque)
  const model = str(
    vinInfo.MODEL_FULL,
    vinInfo.BRAND_MODEL,
    spec.BRAND_MODEL,
    vinInfo.MODEL,
    spec.MODEL,
    spec.model,
    spec.modele,
  )
  const yearRaw =
    yearFromAutoref(vinInfo.DATE_FIRST_CIRCULATION) ||
    yearFromAutoref(spec.DATE_FIRST_CIRCULATION) ||
    num(spec.year, spec.annee) ||
    new Date().getFullYear()
  const fuelType = str(vinInfo.FUEL, spec.FUEL, spec.fuel_type, spec.carburant)
  const engine = str(specs.ENGINE_CODE, spec.ENGINE_CODE, spec.engine_code, spec.moteur, spec.engine)
  const transmission = firstStr(
    vinInfo.GEARBOX,
    vinInfo.DRIVETRAIN,
    spec.GEARBOX,
    spec.transmission,
    spec.gearbox,
  )
  const bodyType = str(vinInfo.BODY, spec.BODY, spec.body_type, spec.carrosserie)
  const color = str(vinInfo.COLOR, spec.COLOR, spec.color, spec.couleur)
  const power = num(vinInfo.POWER_KW, spec.POWER_KW, spec.power_kw, spec.power)
  const doors = num(specs.AXLES_WHEELS, spec.doors, spec.portes)
  const co2 = num(
    emission0.COMBINED_CO2_EMISSIONS,
    consumption0.COMBINED_CO2_EMISSIONS,
    spec.co2,
    spec.co2_emissions,
  )

  return {
    vin: upper,
    make,
    model,
    year: yearRaw,
    fuelType,
    engine,
    transmission,
    bodyType,
    color,
    doors,
    power,
    displacement: 0,
    co2,
    recordType: resolvedType,
    recordId: resolvedId,
  }
}

export async function decodeVin(
  vin: string,
  match?: { id: string; recordType: string },
): Promise<VinDecodeResult> {
  const upper = vin.toUpperCase().trim()

  if (!getEnv().AUTOREF_API_KEY) {
    throw new Error('Service de décodage VIN non configuré')
  }

  const autoref = autorefClient()
  let resolvedId: string
  let resolvedType: string

  if (match?.id && match?.recordType) {
    resolvedId = match.id
    resolvedType = match.recordType
  } else {
    const searchRes = await autoref.get(`/vehicles/${encodeURIComponent(upper)}`, {
      params: { lang: 'fr' },
    })
    const vehicles = searchRes.data as Array<Record<string, unknown>>
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      throw new Error('VIN non reconnu dans la base Autoref')
    }
    const first = vehicles.find((v) => v.id && recordTypeOf(v)) ?? vehicles[0]!
    if (!first.id || !recordTypeOf(first)) {
      throw new Error('Données insuffisantes pour ce VIN')
    }
    resolvedId = String(first.id)
    resolvedType = recordTypeOf(first)
  }

  const cacheKey = `${upper}::${resolvedId}::${resolvedType}`
  const cached = vinCache.get(cacheKey)
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return cached.result
  }

  const specRes = await autoref.get(`/vehicle/${resolvedType}/${resolvedId}`, {
    params: { lang: 'fr' },
  })
  const spec = asRecord(specRes.data)

  const result = mapSpecToDecodeResult(spec, upper, resolvedType, resolvedId)

  vinCache.set(cacheKey, { result, cachedAt: Date.now() })
  return result
}
