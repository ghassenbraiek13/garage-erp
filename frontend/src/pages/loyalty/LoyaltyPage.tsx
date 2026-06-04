import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Gift, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataColumn } from '@/components/ui/DataTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { useAddClientPoints } from '@/hooks/api/useClients'
import {
  useCouponsList,
  useCreateCoupon,
  useDeleteCoupon,
  type ApiCoupon,
} from '@/hooks/api/useCoupons'
import { useGarageLoyaltyStats } from '@/hooks/api/useLoyalty'
import { cn } from '@/lib/utils'
import { formatTND, formatTNDCompact } from '@/utils/currency'

const couponSchema = z.object({
  code: z.string().min(3).optional(),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().min(1),
  minSpend: z.coerce.number().min(0),
  expiresAt: z.string().min(1, 'Date requise'),
  clientId: z.string().optional(),
})

function tierBadgeVariant(tier: string | undefined): 'default' | 'secondary' | 'purple' | 'outline' {
  switch (tier?.toLowerCase()) {
    case 'bronze':
      return 'secondary'
    case 'silver':
      return 'outline'
    case 'gold':
      return 'default'
    case 'platinum':
      return 'purple'
    default:
      return 'secondary'
  }
}

function tierBadgeClass(tier: string | undefined): string {
  switch (tier?.toLowerCase()) {
    case 'bronze':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
    case 'silver':
      return 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30'
    case 'gold':
      return 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-200 border-yellow-500/30'
    case 'platinum':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
    default:
      return ''
  }
}

function tierLabel(t: (k: string) => string, tier: string | undefined): string {
  switch (tier?.toLowerCase()) {
    case 'bronze':
      return t('tierBronze')
    case 'silver':
      return t('tierSilver')
    case 'gold':
      return t('tierGold')
    case 'platinum':
      return t('tierPlatinum')
    default:
      return tier ?? '—'
  }
}

function CreateCouponDialog({
  open,
  onOpenChange,
  clients,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  clients: Array<{ id: string; name: string }>
}) {
  const { t } = useTranslation('loyalty')
  const createCoupon = useCreateCoupon()
  const form = useForm<z.infer<typeof couponSchema>>({
    resolver: zodResolver(couponSchema),
    defaultValues: { type: 'percentage', minSpend: 0 },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('createCoupon')}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await createCoupon.mutateAsync({
                code: values.code?.toUpperCase(),
                type: values.type,
                value: values.value,
                minSpend: values.minSpend,
                expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
                clientId: values.clientId || null,
              })
              toast.success('Coupon créé avec succès')
              onOpenChange(false)
              form.reset()
            } catch (err) {
              const msg =
                axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
                  ? err.response.data.message
                  : 'Erreur lors de la création du coupon'
              toast.error(msg)
            }
          })}
        >
          <div>
            <Label>{t('couponCode')}</Label>
            <Input
              placeholder="PROMO2026"
              {...form.register('code', {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase()
                },
              })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>{t('couponType')}</Label>
              <select
                className={cn(
                  'h-11 w-full rounded-[var(--radius-input)] border border-[var(--border)]',
                  'bg-[var(--bg-surface)] px-3 text-sm',
                )}
                {...form.register('type')}
              >
                <option value="percentage">%</option>
                <option value="fixed">TND</option>
              </select>
            </div>
            <div>
              <Label>{t('couponValue')}</Label>
              <Input type="number" {...form.register('value')} />
            </div>
          </div>
          <div>
            <Label>{t('couponMinSpend')}</Label>
            <Input type="number" {...form.register('minSpend')} />
          </div>
          <div>
            <Label>{t('couponExpiry')}</Label>
            <Input type="date" {...form.register('expiresAt')} />
          </div>
          <div>
            <Label>Client (optionnel)</Label>
            <select
              className={cn(
                'h-11 w-full rounded-[var(--radius-input)] border border-[var(--border)]',
                'bg-[var(--bg-surface)] px-3 text-sm',
              )}
              {...form.register('clientId')}
            >
              <option value="">Tous les clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button className="w-full" type="submit" disabled={createCoupon.isPending}>
            {t('createCoupon')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function LoyaltyPage() {
  const { t } = useTranslation('loyalty')
  const [couponOpen, setCouponOpen] = useState(false)
  const [pointsClientId, setPointsClientId] = useState<string | null>(null)
  const [pointsValue, setPointsValue] = useState(10)

  const { data: stats, isLoading, isError, error, refetch } = useGarageLoyaltyStats()
  const { data: couponsData } = useCouponsList()
  const deleteCoupon = useDeleteCoupon()
  const addPoints = useAddClientPoints()

  const coupons = couponsData?.items ?? []
  const rankedClients = useMemo(
    () => (stats?.clients ?? []).filter((c) => (c.loyaltyPoints ?? 0) > 0),
    [stats?.clients],
  )

  const couponColumns: DataColumn<ApiCoupon>[] = [
    { id: 'code', header: t('couponCode'), cell: (c) => <span className="font-mono font-semibold">{c.code}</span> },
    {
      id: 'type',
      header: t('couponType'),
      cell: (c) => (c.type === 'percentage' ? '%' : c.type === 'fixed' ? 'TND' : c.type),
    },
    {
      id: 'value',
      header: t('couponValue'),
      cell: (c) =>
        c.type === 'fixed' ? formatTNDCompact(c.value ?? 0) : c.type === 'percentage' ? `${c.value ?? 0}%` : (c.value ?? '—'),
    },
    { id: 'min', header: t('couponMinSpend'), cell: (c) => formatTND(c.minSpend ?? 0) },
    {
      id: 'exp',
      header: t('couponExpiry'),
      cell: (c) => (c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('fr-FR') : '—'),
    },
    {
      id: 'used',
      header: 'Utilisé',
      cell: (c) => (
        <Badge variant={c.isUsed ? 'secondary' : 'purple'}>{c.isUsed ? 'Oui' : 'Non'}</Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (c) => (
        <Button
          size="sm"
          variant="secondary"
          type="button"
          disabled={deleteCoupon.isPending}
          onClick={() => {
            void deleteCoupon.mutateAsync(c.id).then(() => toast.success('Coupon supprimé'))
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const clientColumns: DataColumn<(typeof rankedClients)[number]>[] = [
    { id: 'name', header: 'Client', cell: (c) => c.name },
    { id: 'pts', header: t('pointsShort'), cell: (c) => c.loyaltyPoints ?? 0 },
    {
      id: 'tier',
      header: t('tier'),
      cell: (c) => (
        <Badge className={cn('capitalize border', tierBadgeClass(c.loyaltyTier))} variant={tierBadgeVariant(c.loyaltyTier)}>
          {tierLabel(t, c.loyaltyTier)}
        </Badge>
      ),
    },
    {
      id: 'spent',
      header: t('totalSpent'),
      cell: (c) => formatTNDCompact(c.totalSpent ?? 0),
    },
    {
      id: 'actions',
      header: '',
      cell: (c) => (
        <Button size="sm" variant="secondary" type="button" onClick={() => setPointsClientId(c.id)}>
          <Plus className="h-4 w-4" />
          Points
        </Button>
      ),
    },
  ]

  const statCards = [
    { label: 'Total clients', value: stats?.totalClients ?? 0 },
    { label: 'Points distribués', value: stats?.totalPoints ?? 0 },
    { label: 'Coupons actifs', value: stats?.activeCoupons ?? 0 },
    { label: 'Coupons utilisés', value: stats?.usedCoupons ?? 0 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-clay-purple/15 text-clay-purple">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-fluid-h1 font-semibold">{t('title')}</h1>
            <p className="text-sm text-ink-secondary">{t('coupons')}</p>
          </div>
        </div>
        <Button type="button" onClick={() => setCouponOpen(true)}>
          {t('createCoupon')}
        </Button>
      </div>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        onRetry={() => void refetch()}
        loading={<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 animate-pulse rounded-[var(--radius-card)] bg-[var(--bg-sidebar)]" />)}</div>}
        empty={null}
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((s) => (
            <ClayCard key={s.label} variant="elevated">
              <CardContent className="p-4">
                <p className="text-xs text-ink-muted">{s.label}</p>
                <p className="text-2xl font-bold text-ink-primary">{s.value}</p>
              </CardContent>
            </ClayCard>
          ))}
        </div>
      </QueryBoundary>

      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">{t('coupons')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={couponColumns} data={coupons} getRowKey={(c) => c.id} />
        </CardContent>
      </ClayCard>

      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Classement fidélité</CardTitle>
        </CardHeader>
        <CardContent>
          {rankedClients.length === 0 ? (
            <p className="text-sm text-ink-muted">Aucun client avec des points.</p>
          ) : (
            <DataTable columns={clientColumns} data={rankedClients} getRowKey={(c) => c.id} />
          )}
        </CardContent>
      </ClayCard>

      <CreateCouponDialog
        open={couponOpen}
        onOpenChange={setCouponOpen}
        clients={stats?.clients ?? []}
      />

      <Dialog open={Boolean(pointsClientId)} onOpenChange={(o) => !o && setPointsClientId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter des points</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Points</Label>
              <Input
                type="number"
                min={1}
                value={pointsValue}
                onChange={(e) => setPointsValue(Number(e.target.value))}
              />
            </div>
            <Button
              className="w-full"
              type="button"
              disabled={!pointsClientId || addPoints.isPending}
              onClick={() => {
                if (!pointsClientId) return
                void addPoints
                  .mutateAsync({ id: pointsClientId, points: pointsValue })
                  .then(() => {
                    toast.success('Points ajoutés')
                    setPointsClientId(null)
                  })
              }}
            >
              Valider
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
