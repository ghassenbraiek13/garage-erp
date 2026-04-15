import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { mockGarages } from '@/mocks/mockGarages'

export function SuperAdminGarages() {
  const { t } = useTranslation('superAdmin')
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{t('garages')}</h2>
        <Button type="button">{t('createGarage')}</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Offre</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockGarages.map((g) => (
            <TableRow key={g.id}>
              <TableCell className="font-medium">{g.name}</TableCell>
              <TableCell>
                <Badge variant={g.status === 'active' ? 'success' : 'danger'}>{g.status}</Badge>
              </TableCell>
              <TableCell>{g.subscriptionTier}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
