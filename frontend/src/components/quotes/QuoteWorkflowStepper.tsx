import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { QUOTE_STATUS_ORDER, type QuoteStatus } from '@/lib/quoteUtils'

const BRANCH_REJECTED: QuoteStatus = 'rejected'

export function QuoteWorkflowStepper({ status }: { status: string }) {
  const { t } = useTranslation('quotes')
  const current = status as QuoteStatus
  const currentIdx = QUOTE_STATUS_ORDER.indexOf(current)
  const isRejected = current === BRANCH_REJECTED
  const isExpired = current === 'expired'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold sm:text-sm">
        {QUOTE_STATUS_ORDER.map((step, idx) => {
          const done = !isRejected && !isExpired && currentIdx > idx
          const active = current === step
          return (
            <div key={step} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors',
                  active
                    ? 'border-clay-primary bg-[var(--bg-badge-blue)] text-[var(--text-badge-blue)]'
                    : done
                      ? 'border-[var(--border)] bg-[var(--bg-badge-green)] text-[var(--text-badge-green)]'
                      : 'border-[var(--border)] bg-[var(--bg-sidebar)] text-ink-muted',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : null}
                {t(`status.${step}`)}
              </span>
              {idx < QUOTE_STATUS_ORDER.length - 1 ? (
                <span className="text-ink-muted" aria-hidden>
                  →
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
      {isRejected ? (
        <p className="text-sm text-clay-red">
          ↓ {t('status.rejected')}
        </p>
      ) : null}
      {isExpired ? (
        <p className="text-sm text-clay-orange">{t('status.expired')}</p>
      ) : null}
    </div>
  )
}
