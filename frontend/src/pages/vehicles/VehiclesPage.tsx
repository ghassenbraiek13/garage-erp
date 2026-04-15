import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { mockClients } from '@/mocks/mockClients'
import { mockVehicles } from '@/mocks/mockVehicles'

const plateRegex = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/i

const vinSchema = z.object({
  vin: z.string().length(17, 'VIN 17 caractères'),
})

export function VehiclesPage() {
  const { t } = useTranslation(['vehicles', 'common'])
  const [vinLoading, setVinLoading] = useState(false)
  const [decoded, setDecoded] = useState<{ make: string; model: string; year: number } | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const [plateQ, setPlateQ] = useState('')
  const [plateErr, setPlateErr] = useState<string | null>(null)
  const vinForm = useForm<z.infer<typeof vinSchema>>({ resolver: zodResolver(vinSchema) })

  const vehicles = useMemo(() => mockVehicles, [])

  const decodeVin = vinForm.handleSubmit(async () => {
    setVinLoading(true)
    setDecoded(null)
    await new Promise((r) => setTimeout(r, 900))
    setDecoded({ make: 'Peugeot', model: '308', year: 2019 })
    setVinLoading(false)
  })

  const filtered = useMemo(() => {
    const plate = plateQ.trim().toUpperCase()
    if (!plate) return vehicles
    if (!plateRegex.test(plate)) return vehicles
    return vehicles.filter((v) => v.plate.replace(/\s/g, '').includes(plate.replace(/\s/g, '')))
  }, [plateQ, vehicles])

  const v = vehicles.find((x) => x.id === selected)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-fluid-h1 font-semibold">{t('vehicles:title')}</h1>
        <p className="text-sm text-ink-secondary">VIN décodé en démo — plaques format français</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ClayCard variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">{t('vehicles:decode')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form className="space-y-2" onSubmit={decodeVin}>
              <Label htmlFor="vin">{t('vehicles:vin')}</Label>
              <Input id="vin" {...vinForm.register('vin')} placeholder="VF3..." />
              {vinForm.formState.errors.vin ? (
                <p className="text-xs text-clay-red">{vinForm.formState.errors.vin.message}</p>
              ) : null}
              <Button className="w-full" type="submit" disabled={vinLoading}>
                {vinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t('vehicles:decode')}
              </Button>
            </form>
            {decoded ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3 text-sm">
                <p className="font-semibold">
                  {decoded.make} {decoded.model} ({decoded.year})
                </p>
              </div>
            ) : null}
          </CardContent>
        </ClayCard>

        <ClayCard variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Recherche plaque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="plate">{t('vehicles:plate')}</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <Input
                id="plate"
                className="ps-10"
                placeholder="AB-123-CD"
                value={plateQ}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase()
                  setPlateQ(v)
                  setPlateErr(v && !plateRegex.test(v.trim()) ? t('vehicles:invalidPlate') : null)
                }}
              />
            </div>
            {plateErr ? <p className="text-xs text-clay-red">{plateErr}</p> : null}
          </CardContent>
        </ClayCard>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((veh) => {
          const owner = mockClients.find((c) => c.id === veh.clientId)
          return (
            <button
              key={veh.id}
              type="button"
              onClick={() => setSelected(veh.id)}
              className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-start shadow-clay backdrop-blur-clay transition hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="primary">{veh.plate}</Badge>
                <span className="text-xs text-ink-muted">{veh.year}</span>
              </div>
              <p className="mt-2 font-semibold">
                {veh.make} {veh.model}
              </p>
              <p className="text-xs text-ink-secondary">{owner?.name}</p>
              <p className="mt-2 text-sm text-ink-secondary">
                {veh.mileage.toLocaleString('fr-FR')} km · {t('vehicles:lastService')}: {veh.lastService ?? '—'}
              </p>
            </button>
          )
        })}
      </div>

      {v ? (
        <ClayCard variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">{t('vehicles:detail')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              VIN: <span className="font-mono">{v.vin}</span>
            </p>
            <p>
              {t('vehicles:mileage')}: {v.mileage.toLocaleString('fr-FR')} km
            </p>
            <p className="font-semibold">{t('vehicles:maintenance')}</p>
            <ul className="list-disc space-y-1 ps-5 text-ink-secondary">
              <li>2026-01 — Vidange + filtres</li>
              <li>2025-08 — Freinage AV</li>
              <li>2025-03 — Révision annuelle</li>
            </ul>
            <Button variant="secondary" type="button" onClick={() => setSelected(null)}>
              {t('common:close')}
            </Button>
          </CardContent>
        </ClayCard>
      ) : null}
    </div>
  )
}
