import { useTranslation } from 'react-i18next'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { mockClients } from '@/mocks/mockClients'
import { mockMechanics } from '@/mocks/mockMechanics'
import { mockRepairs } from '@/mocks/mockRepairs'
import { mockVehicles } from '@/mocks/mockVehicles'
import type { RepairStatus } from '@/types'

function map(s: RepairStatus): Parameters<typeof StatusBadge>[0]['status'] {
  if (s === 'in_progress') return 'in_progress'
  if (s === 'completed') return 'completed'
  if (s === 'pending') return 'pending'
  return 'cancelled'
}

export function RepairsPage() {
  const { t } = useTranslation(['repairs', 'dashboard'])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-fluid-h1 font-semibold">{t('title')}</h1>
        <p className="text-sm text-ink-secondary">{t('subtitle')}</p>
      </div>
      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Liste</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('client', { ns: 'dashboard' })}</TableHead>
                <TableHead>{t('vehicle', { ns: 'dashboard' })}</TableHead>
                <TableHead>{t('type', { ns: 'dashboard' })}</TableHead>
                <TableHead>{t('mechanic', { ns: 'dashboard' })}</TableHead>
                <TableHead>{t('status', { ns: 'common' })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRepairs.map((r) => {
                const c = mockClients.find((x) => x.id === r.clientId)
                const v = mockVehicles.find((x) => x.id === r.vehicleId)
                const m = mockMechanics.find((x) => x.id === r.mechanicId)
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{c?.name}</TableCell>
                    <TableCell>{v ? `${v.make} ${v.model}` : '—'}</TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell>{m?.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={map(r.status)} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </ClayCard>
    </div>
  )
}
