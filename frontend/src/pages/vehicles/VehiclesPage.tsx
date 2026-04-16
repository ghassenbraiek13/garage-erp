import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { useVehiclesList, type ApiVehicle } from '@/hooks/api/useVehicles'
import api from '@/utils/api'

const plateRegex = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/i

const vinSchema = z.object({
  vin: z.string().length(17, 'VIN 17 caractères'),
})

export function VehiclesPage(): React.ReactElement {
  const { t } = useTranslation(['vehicles', 'common'])
  const [vinLoading, setVinLoading] = useState(false)
  const [decoded, setDecoded] = useState<Record<string, unknown> | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const [plateQ, setPlateQ] = useState('')
  const [plateErr, setPlateErr] = useState<string | null>(null)
  const vinForm = useForm<z.infer<typeof vinSchema>>({ resolver: zodResolver(vinSchema) })

  const { data, isLoading, isError, error, refetch } = useVehiclesList(plateQ.trim() || undefined)
  const vehicles = data?.items ?? []

  const decodeVin = vinForm.handleSubmit(async (values) => {
    setVinLoading(true)
    setDecoded(null)
    try {
      const { data: res } = await api.get<{ data: Record<string, unknown> }>(`/vehicles/vin/${encodeURIComponent(values.vin)}`)
      setDecoded(res.data)
    } catch {
      toast.error('Décodage VIN impossible')
    } finally {
      setVinLoading(false)
    }
  })

  const filtered = useMemo(() => {
    const plate = plateQ.trim().toUpperCase()
    if (!plate || !plateRegex.test(plate)) return vehicles
    return vehicles.filter((v) => v.plate.replace(/\s/g, '').includes(plate.replace(/\s/g, '')))
  }, [plateQ, vehicles])

  const v = vehicles.find((x) => x.id === selected)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-fluid-h1 font-semibold">{t('vehicles:title')}</h1>
        <p className="text-sm text-ink-secondary">VIN via API · recherche côté serveur</p>
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
              <pre className="max-h-40 overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3 text-xs text-[var(--text-primary)]">
                {JSON.stringify(decoded, null, 2)}
              </pre>
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
                  const val = e.target.value.toUpperCase()
                  setPlateQ(val)
                  setPlateErr(val && !plateRegex.test(val.trim()) ? t('vehicles:invalidPlate') : null)
                }}
              />
            </div>
            {plateErr ? <p className="text-xs text-clay-red">{plateErr}</p> : null}
          </CardContent>
        </ClayCard>
      </div>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        onRetry={() => void refetch()}
        isEmpty={!isLoading && filtered.length === 0}
        loading={<TableSkeleton rows={5} />}
        empty={<p className="text-sm text-ink-muted">Aucun véhicule</p>}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((veh: ApiVehicle) => (
            <button
              key={veh.id}
              type="button"
              onClick={() => setSelected(veh.id)}
              className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-start shadow-clay backdrop-blur-clay transition hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="primary">{veh.plate}</Badge>
                <span className="text-xs text-ink-muted">{veh.year ?? '—'}</span>
              </div>
              <p className="mt-2 font-semibold">
                {veh.make} {veh.model}
              </p>
              <p className="text-xs text-ink-secondary">Client : {veh.clientId}</p>
              <p className="mt-2 text-sm text-ink-secondary">
                {(veh.mileage ?? 0).toLocaleString('fr-FR')} km · {t('vehicles:lastService')}: —
              </p>
            </button>
          ))}
        </div>
      </QueryBoundary>

      {v ? (
        <ClayCard variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">{t('vehicles:detail')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              VIN: <span className="font-mono">{v.vin ?? '—'}</span>
            </p>
            <p>
              {t('vehicles:mileage')}: {(v.mileage ?? 0).toLocaleString('fr-FR')} km
            </p>
            <Button variant="secondary" type="button" onClick={() => setSelected(null)}>
              {t('common:close')}
            </Button>
          </CardContent>
        </ClayCard>
      ) : null}
    </div>
  )
}
