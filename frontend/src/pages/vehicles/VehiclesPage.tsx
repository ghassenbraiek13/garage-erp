import { format } from 'date-fns'
import { arSA, fr } from 'date-fns/locale'
import { Eye, History, Pencil, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AddVehicleModal } from '@/components/portal/AddVehicleModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataColumn } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/input'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { useClientsList } from '@/hooks/api/useClients'
import { useVehiclesList, type ApiVehicle } from '@/hooks/api/useVehicles'
import { useLocaleStore } from '@/store/locale'

export function VehiclesPage(): React.ReactElement {
  const { t } = useTranslation(['vehicles', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const dateLocale = locale === 'ar' ? arSA : fr
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [selected, setSelected] = useState<ApiVehicle | null>(null)

  const { data, isLoading, isError, error, refetch } = useVehiclesList(search.trim() || undefined)
  const { data: clientsData } = useClientsList(undefined, 1, 200)
  const vehicles = data?.items ?? []

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of clientsData?.items ?? []) {
      map.set(c.id, c.name)
    }
    return map
  }, [clientsData?.items])

  const columns: DataColumn<ApiVehicle>[] = [
    {
      id: 'plate',
      header: t('vehicles:plate'),
      cell: (v) => <Badge variant="primary">{v.plate}</Badge>,
    },
    {
      id: 'vehicle',
      header: t('vehicles:vehicleLabel'),
      cell: (v) => (
        <span className="font-medium">
          {v.make} {v.model}
          {v.year ? ` (${v.year})` : ''}
        </span>
      ),
    },
    {
      id: 'client',
      header: t('vehicles:associatedClient'),
      cell: (v) => clientNameById.get(v.clientId) ?? '—',
    },
    {
      id: 'mileage',
      header: t('vehicles:mileage'),
      cell: (v) => `${(v.mileage ?? 0).toLocaleString(locale === 'ar' ? 'ar-TN' : 'fr-FR')} km`,
    },
    {
      id: 'lastService',
      header: t('vehicles:lastService'),
      cell: (v) =>
        v.lastServiceDate
          ? format(new Date(v.lastServiceDate), 'PP', { locale: dateLocale })
          : '—',
    },
    {
      id: 'actions',
      header: <span className="text-end">{t('common:actions')}</span>,
      headerClassName: 'text-end',
      cellClassName: 'text-end',
      cell: (v) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="secondary" type="button" onClick={() => setSelected(v)}>
            <Eye className="h-3.5 w-3.5" />
            {t('common:view')}
          </Button>
          <Button size="sm" variant="secondary" type="button" onClick={() => setSelected(v)}>
            <Pencil className="h-3.5 w-3.5" />
            {t('common:edit')}
          </Button>
          <Button size="sm" variant="ghost" type="button" onClick={() => setSelected(v)}>
            <History className="h-3.5 w-3.5" />
            {t('vehicles:history')}
          </Button>
        </div>
      ),
    },
  ]

  const v = selected

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-fluid-h1 font-semibold">{t('vehicles:title')}</h1>
          <p className="text-sm text-ink-secondary">{t('vehicles:subtitle')}</p>
        </div>
        <Button type="button" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('vehicles:addVehicle')}
        </Button>
      </div>

      <ClayCard variant="elevated">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{t('vehicles:listTitle')}</CardTitle>
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              className="ps-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common:search')}
            />
          </div>
        </CardHeader>
        <CardContent>
          <QueryBoundary
            isLoading={isLoading}
            isError={isError}
            error={error as Error}
            onRetry={() => void refetch()}
            isEmpty={!isLoading && vehicles.length === 0}
            loading={<TableSkeleton rows={6} />}
            empty={<p className="text-sm text-ink-muted">{t('vehicles:empty')}</p>}
          >
            <DataTable columns={columns} data={vehicles} getRowKey={(veh) => veh.id} />
          </QueryBoundary>
        </CardContent>
      </ClayCard>

      {v ? (
        <ClayCard variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">{t('vehicles:detail')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {v.make} {v.model} — <span className="font-mono">{v.plate}</span>
            </p>
            <p>
              VIN: <span className="font-mono">{v.vin ?? '—'}</span>
            </p>
            <p>
              {t('vehicles:mileage')}: {(v.mileage ?? 0).toLocaleString(locale === 'ar' ? 'ar-TN' : 'fr-FR')} km
            </p>
            <p>
              {t('vehicles:associatedClient')}: {clientNameById.get(v.clientId) ?? '—'}
            </p>
            <Button variant="secondary" type="button" onClick={() => setSelected(null)}>
              {t('common:close')}
            </Button>
          </CardContent>
        </ClayCard>
      ) : null}

      <AddVehicleModal open={addOpen} onOpenChange={setAddOpen} showClientSelect onCreated={() => void refetch()} />
    </div>
  )
}
