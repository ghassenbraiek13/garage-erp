import { Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useRepair } from '@/hooks/api/useRepairs'
import { refLabel, repairShortId } from '@/lib/quoteUtils'

type QuoteRepairCardProps = {
  repairId: string | undefined
}

function mapRepairStatus(s: string): 'in_progress' | 'completed' | 'pending' | 'cancelled' {
  if (s === 'in_progress' || s === 'waiting_parts') return 'in_progress'
  if (s === 'completed') return 'completed'
  if (s === 'pending') return 'pending'
  return 'cancelled'
}

export function QuoteRepairCard({ repairId }: QuoteRepairCardProps) {
  const { t } = useTranslation('quotes')
  const { data: repair, isLoading } = useRepair(repairId)

  if (!repairId) return null
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-4 text-sm text-ink-muted">
        {t('linkedRepairLoading')}
      </div>
    )
  }
  if (!repair) return null

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-4 shadow-clay">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-badge-blue)] text-clay-primary">
          <Wrench className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t('linkedRepair')}</p>
          <p className="font-semibold text-ink-primary">
            {repairShortId(repair.id)} — {refLabel(repair.vehicleId)}
          </p>
          <p className="mt-1 text-sm text-ink-secondary">
            {t('repairStatus')}: <StatusBadge status={mapRepairStatus(repair.status)} />
            {repair.mechanicId ? (
              <>
                {' '}
                | {t('repairMechanic')}: {refLabel(repair.mechanicId)}
              </>
            ) : null}
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-3">
            <Link to={`/repairs/${repair.id}`}>{t('viewRepair')}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
