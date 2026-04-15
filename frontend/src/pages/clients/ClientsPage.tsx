import { zodResolver } from '@hookform/resolvers/zod'
import { FileSpreadsheet, FileText, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrencyEUR, formatNumber } from '@/lib/utils'
import { mockClients } from '@/mocks/mockClients'
import { mockVehicles } from '@/mocks/mockVehicles'
import { useLocaleStore } from '@/store/locale'
import type { Client } from '@/types'

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
  address: z.string().min(4),
})

export function ClientsPage() {
  const { t } = useTranslation(['clients', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const [q, setQ] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null)
  const [detail, setDetail] = useState<Client | null>(null)

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return mockClients.filter((c) => !qq || c.name.toLowerCase().includes(qq) || c.phone.includes(qq))
  }, [q])

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-fluid-h1 font-semibold">{t('clients:title')}</h1>
          <p className="text-sm text-ink-secondary">CRM atelier — données fictives</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => toast.success('Export PDF (démo)')}>
            <FileText className="h-4 w-4" />
            {t('clients:exportPdf')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => toast.success('Export Excel (démo)')}>
            <FileSpreadsheet className="h-4 w-4" />
            {t('clients:exportXlsx')}
          </Button>
          <Button type="button" onClick={() => setOpenCreate(true)}>
            <Plus className="h-4 w-4" />
            {t('clients:new')}
          </Button>
        </div>
      </div>

      <ClayCard variant="elevated">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{t('clients:title')}</CardTitle>
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input className="ps-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common:search')} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="md:hidden space-y-3">
            {rows.map((c) => (
              <button
                key={c.id}
                type="button"
                className="w-full rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-sidebar)] p-4 text-start shadow-clay"
                onClick={() => setDetail(c)}
              >
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-ink-secondary">{c.phone}</p>
                <p className="mt-2 text-sm">
                  {t('clients:spent')}: {formatCurrencyEUR(c.totalSpent, locale)}
                </p>
              </button>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('clients:name')}</TableHead>
                  <TableHead>{t('clients:phone')}</TableHead>
                  <TableHead>{t('clients:vehicles')}</TableHead>
                  <TableHead>{t('clients:lastVisit')}</TableHead>
                  <TableHead>{t('clients:spent')}</TableHead>
                  <TableHead className="text-end">{t('common:actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.vehicleIds.length}</TableCell>
                    <TableCell>{c.lastVisit ?? '—'}</TableCell>
                    <TableCell>{formatCurrencyEUR(c.totalSpent, locale)}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setDetail(c)}>
                          {t('common:view')}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => toast.message('Édition (démo)')}>
                          {t('common:edit')}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setConfirmDelete(c)}>
                          {t('common:delete')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </ClayCard>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('clients:new')}</DialogTitle>
            <DialogDescription>Formulaire validé côté client (Zod)</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit(() => {
              toast.success('Client créé (démo)')
              setOpenCreate(false)
              form.reset()
            })}
          >
            <div>
              <Label>{t('clients:name')}</Label>
              <Input {...form.register('name')} />
            </div>
            <div>
              <Label>{t('clients:phone')}</Label>
              <Input {...form.register('phone')} />
            </div>
            <div>
              <Label>Email</Label>
              <Input {...form.register('email')} />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input {...form.register('address')} />
            </div>
            <Button className="w-full" type="submit">
              {t('common:save')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmDelete)} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common:confirm')}</DialogTitle>
            <DialogDescription>{t('clients:deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setConfirmDelete(null)}>
              {t('common:cancel')}
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={() => {
                toast.success('Supprimé (démo)')
                setConfirmDelete(null)
              }}
            >
              {t('common:delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {detail ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            aria-label="Fermer"
            onClick={() => setDetail(null)}
          />
          <aside className="fixed inset-y-0 end-0 z-[70] w-full max-w-lg animate-in slide-in-from-right border-s border-[var(--border)] bg-[var(--bg-surface)] shadow-clay backdrop-blur-clay duration-300">
            <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t('clients:detailTitle')}</p>
                  <h2 className="text-xl font-semibold">{detail.name}</h2>
                </div>
                <Button variant="secondary" type="button" onClick={() => setDetail(null)}>
                  {t('common:close')}
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-ink-secondary">{t('clients:phone')}:</span> {detail.phone}
                </p>
                <p>
                  <span className="text-ink-secondary">Email:</span> {detail.email}
                </p>
                <p>
                  <span className="text-ink-secondary">Adresse:</span> {detail.address}
                </p>
                <p>
                  <span className="text-ink-secondary">Points fidélité:</span> {formatNumber(detail.loyaltyPoints, locale)}
                </p>
              </div>
              <div>
                <p className="mb-2 font-semibold">{t('clients:history')}</p>
                <div className="space-y-2">
                  {detail.vehicleIds.map((vid) => {
                    const v = mockVehicles.find((x) => x.id === vid)
                    return (
                      <div key={vid} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3 text-sm">
                        {v ? `${v.make} ${v.model} (${v.plate})` : vid}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  )
}
