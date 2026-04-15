import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const rows = [
  { id: 'u1', name: 'Marc Dupont', role: 'manager', garage: 'Garage Dupont Performance' },
  { id: 'u2', name: 'Thomas Leroy', role: 'mechanic', garage: 'Garage Dupont Performance' },
]

export function SuperAdminUsers() {
  const { t } = useTranslation('superAdmin')
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">{t('users')}</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Garage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>
                <Badge variant="primary">{r.role}</Badge>
              </TableCell>
              <TableCell>{r.garage}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
