import { differenceInDays, format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
  Award,
  Calendar,
  Copy,
  Crown,
  History,
  Medal,
  RefreshCw,
  Star,
  Tag,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useApplyCoupon,
  useLoyaltyInfo,
  type LoyaltyCoupon,
  type LoyaltyInfo,
  type LoyaltyTier,
} from '@/hooks/api/useLoyalty'
import { cn } from '@/lib/utils'
import { formatTND, formatTNDCompact } from '@/utils/currency'

const TIER_THRESHOLDS = {
  bronze: { min: 0, next: 1000, nextTier: 'silver' as LoyaltyTier },
  silver: { min: 1000, next: 5000, nextTier: 'gold' as LoyaltyTier },
  gold: { min: 5000, next: 10000, nextTier: 'platinum' as LoyaltyTier },
  platinum: { min: 10000, next: null, nextTier: null },
}

function tierProgress(points: number, tier: LoyaltyTier) {
  const cfg = TIER_THRESHOLDS[tier]
  if (!cfg.next) return { percent: 100, remaining: 0, max: true }
  const span = cfg.next - cfg.min
  const current = Math.max(0, points - cfg.min)
  const percent = Math.min(100, Math.round((current / span) * 100))
  const remaining = Math.max(0, cfg.next - points)
  return { percent, remaining, max: false, nextTier: cfg.nextTier }
}

function TierIcon({ tier, className }: { tier: LoyaltyTier; className?: string }) {
  const props = { className: cn('h-8 w-8', className), 'aria-hidden': true as const }
  switch (tier) {
    case 'bronze':
      return <Medal {...props} />
    case 'silver':
      return <Award {...props} />
    case 'gold':
      return <Crown {...props} />
    case 'platinum':
      return <Star {...props} fill="currentColor" />
    default:
      return <Medal {...props} />
  }
}

function tierBadgeClass(tier: LoyaltyTier): string {
  switch (tier) {
    case 'bronze':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700'
    case 'silver':
      return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-zinc-800/60 dark:text-zinc-200 dark:border-zinc-600'
    case 'gold':
      return 'bg-yellow-100 text-yellow-700 border-yellow-400 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-700'
    case 'platinum':
      return 'bg-blue-100 text-blue-700 border-blue-400 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-700'
    default:
      return ''
  }
}

function tierLabel(t: (k: string) => string, tier: LoyaltyTier): string {
  const map: Record<LoyaltyTier, string> = {
    bronze: t('tierBronze'),
    silver: t('tierSilver'),
    gold: t('tierGold'),
    platinum: t('tierPlatinum'),
  }
  return map[tier] ?? tier
}

function formatDatePP(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'PP', { locale: fr })
  } catch {
    return dateStr
  }
}

function UseCouponDialog({
  coupon,
  open,
  onOpenChange,
}: {
  coupon: LoyaltyCoupon
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { t } = useTranslation('loyalty')
  const applyCoupon = useApplyCoupon()
  const [quoteId, setQuoteId] = useState('')

  const discountLabel =
    coupon.type === 'percentage' ? `-${coupon.value}%` : `-${formatTNDCompact(coupon.value)}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('useCoupon')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-clay-primary/40 bg-clay-primary/5 p-4 text-center">
            <p className="font-mono text-lg font-bold uppercase">{coupon.code}</p>
            <p className="mt-1 text-2xl font-bold text-clay-primary">{discountLabel}</p>
          </div>
          <div>
            <Label htmlFor="quoteId">{t('quoteId')}</Label>
            <Input
              id="quoteId"
              value={quoteId}
              onChange={(e) => setQuoteId(e.target.value)}
              placeholder="Entrez l'ID du devis"
            />
            <p className="mt-1 text-xs text-ink-muted">Le coupon sera appliqué à ce devis</p>
          </div>
          <Button
            className="w-full"
            variant="primary"
            type="button"
            disabled={applyCoupon.isPending || !quoteId.trim()}
            onClick={() => {
              void applyCoupon
                .mutateAsync({ couponCode: coupon.code, quoteId: quoteId.trim() })
                .then(() => {
                  toast.success(t('couponApplied'))
                  setQuoteId('')
                  onOpenChange(false)
                })
                .catch((err) => {
                  const msg =
                    axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
                      ? err.response.data.message
                      : t('couponInvalid')
                  toast.error(msg)
                })
            }}
          >
            {t('applyCoupon')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CouponCard({ coupon, index }: { coupon: LoyaltyCoupon; index: number }) {
  const { t } = useTranslation('loyalty')
  const [dialogOpen, setDialogOpen] = useState(false)
  const expiringSoon =
    coupon.expiresAt && differenceInDays(parseISO(coupon.expiresAt), new Date()) < 7

  const discountLabel =
    coupon.type === 'percentage' ? `-${coupon.value}%` : `-${formatTNDCompact(coupon.value)}`

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          'min-w-[260px] shrink-0 rounded-2xl border-2 border-dashed border-clay-primary/40 p-4',
          'bg-[var(--bg-surface)] md:min-w-0',
        )}
      >
        <p className="text-center text-3xl font-bold text-clay-primary">{discountLabel}</p>
        <button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-2 font-mono text-sm font-semibold uppercase tracking-wide text-ink-primary"
          onClick={() => {
            void navigator.clipboard.writeText(coupon.code)
            toast.success(t('codeCopied'))
          }}
        >
          {coupon.code}
          <Copy className="h-4 w-4 text-ink-muted" />
        </button>
        {coupon.minSpend > 0 ? (
          <p className="mt-2 text-center text-xs text-ink-secondary">
            {t('minSpend')} {formatTND(coupon.minSpend)}
          </p>
        ) : null}
        {coupon.expiresAt ? (
          <p
            className={cn(
              'mt-1 text-center text-xs',
              expiringSoon ? 'font-semibold text-clay-red' : 'text-ink-muted',
            )}
          >
            {t('expires')} {formatDatePP(coupon.expiresAt)}
          </p>
        ) : null}
        <Button
          className="mt-4 w-full"
          variant="primary"
          size="sm"
          type="button"
          onClick={() => setDialogOpen(true)}
        >
          {t('useCoupon')}
        </Button>
      </motion.div>
      <UseCouponDialog coupon={coupon} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

function HeroSection({ info }: { info: LoyaltyInfo }) {
  const { t } = useTranslation('loyalty')
  const progress = tierProgress(info.points, info.tier)

  return (
    <ClayCard variant="elevated">
      <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <p className="text-5xl font-bold text-clay-primary">{info.points.toLocaleString('fr-FR')}</p>
          <p className="mt-1 text-sm text-ink-secondary">{t('points')}</p>
          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-table-header)]">
              <div
                className="h-full rounded-full bg-clay-primary transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              {progress.max
                ? t('maxTier')
                : `${progress.remaining.toLocaleString('fr-FR')} ${t('nextTier')}`}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end">
          <div
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2 text-lg font-semibold',
              tierBadgeClass(info.tier),
            )}
          >
            <TierIcon tier={info.tier} className="h-6 w-6" />
            {tierLabel(t, info.tier)}
          </div>
          <p className="mt-2 text-sm text-ink-secondary">
            {t('totalSpent')}: {formatTNDCompact(info.totalSpent)}
          </p>
        </div>
      </CardContent>
    </ClayCard>
  )
}

function CouponsSection({ coupons }: { coupons: LoyaltyCoupon[] }) {
  const { t } = useTranslation('loyalty')

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-primary">
        <Tag className="h-5 w-5 text-clay-primary" />
        {t('couponsTitle')}
      </h2>
      {coupons.length === 0 ? (
        <ClayCard variant="elevated">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Tag className="h-10 w-10 text-ink-muted" />
            <p className="text-sm text-ink-secondary">{t('noCoupons')}</p>
          </CardContent>
        </ClayCard>
      ) : (
        <div
          className={cn(
            'flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3',
          )}
        >
          {coupons.map((c, i) => (
            <CouponCard key={c.id} coupon={c} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}

function HistorySection({ history }: { history: LoyaltyInfo['history'] }) {
  const { t } = useTranslation('loyalty')
  const [showAll, setShowAll] = useState(false)
  const sorted = useMemo(
    () =>
      [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [history],
  )
  const visible = showAll ? sorted : sorted.slice(0, 10)

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-primary">
        <History className="h-5 w-5 text-clay-primary" />
        {t('historyTitle')}
      </h2>
      {sorted.length === 0 ? (
        <ClayCard variant="elevated">
          <CardContent className="py-8 text-center text-sm text-ink-secondary">{t('noHistory')}</CardContent>
        </ClayCard>
      ) : (
        <ClayCard variant="elevated">
          <CardContent className="divide-y divide-[var(--border)] p-0">
            {visible.map((entry, i) => (
              <div
                key={`${entry.date}-${entry.motif}-${i}`}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
              >
                <div className="flex min-w-[140px] items-center gap-2 text-ink-secondary">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {formatDatePP(entry.date)}
                </div>
                <div className="flex flex-1 items-center gap-2 text-ink-primary">
                  <span>{entry.motif}</span>
                  {entry.factureId ? (
                    <Badge variant="outline" className="gap-1 text-xs">
                      Facture
                    </Badge>
                  ) : null}
                </div>
                <Badge
                  className={cn(
                    'ms-auto font-semibold',
                    entry.pointsGagnes > 0
                      ? 'border-clay-green/40 bg-clay-green/10 text-clay-green'
                      : 'border-clay-red/40 bg-clay-red/10 text-clay-red',
                  )}
                  variant="outline"
                >
                  {entry.pointsGagnes > 0 ? `+${entry.pointsGagnes}` : entry.pointsGagnes} pts
                </Badge>
              </div>
            ))}
          </CardContent>
          {sorted.length > 10 ? (
            <div className="border-t border-[var(--border)] p-3 text-center">
              <Button variant="secondary" size="sm" type="button" onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'Réduire' : t('viewMore')}
              </Button>
            </div>
          ) : null}
        </ClayCard>
      )}
    </section>
  )
}

function LoyaltySkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-[var(--bg-sidebar)]" />
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--bg-sidebar)]" />
      <div className="flex gap-3 overflow-hidden">
        {[1, 2].map((i) => (
          <div key={i} className="h-52 w-64 shrink-0 animate-pulse rounded-2xl bg-[var(--bg-sidebar)]" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-[var(--bg-sidebar)]" />
    </div>
  )
}

const sectionMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

export function PortalLoyaltyPage(): React.ReactElement {
  const { t } = useTranslation('loyalty')
  const { data, isLoading, isError, error, refetch } = useLoyaltyInfo()

  if (isLoading) return <LoyaltySkeleton />

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-sm text-ink-secondary">
          {(error as Error)?.message ?? 'Impossible de charger vos données de fidélité.'}
        </p>
        <Button type="button" variant="secondary" className="gap-2" onClick={() => void refetch()}>
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-primary">{t('portalTitle')}</h1>
      </div>

      <motion.div {...sectionMotion} transition={{ delay: 0 }}>
        <HeroSection info={data} />
      </motion.div>

      <motion.div {...sectionMotion} transition={{ delay: 0.1 }}>
        <CouponsSection coupons={data.coupons} />
      </motion.div>

      <motion.div {...sectionMotion} transition={{ delay: 0.2 }}>
        <HistorySection history={data.history} />
      </motion.div>
    </div>
  )
}
