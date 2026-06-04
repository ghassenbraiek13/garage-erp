import { format } from 'date-fns'
import { arSA, fr } from 'date-fns/locale'
import { Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ApiVehicle } from '@/hooks/api/useVehicles'
import { useVehicleRepairs } from '@/hooks/api/useVehicles'
import { cn } from '@/lib/utils'
import { formatTND } from '@/utils/currency'
import { useLocaleStore } from '@/store/locale'

type VehicleHistoryModalProps = {
  vehicle: ApiVehicle | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function statusBadgeVariant(
  status: string,
): 'default' | 'primary' | 'success' | 'danger' | 'warning' {
  switch (status) {
    case 'in_progress':
    case 'waiting_parts':
      return 'primary'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'danger'
    default:
      return 'default'
  }
}

function statusLabel(status: string, t: (key: string) => string): string {
  const keys: Record<string, string> = {
    pending: 'repairs:statusPending',
    in_progress: 'repairs:statusInProgress',
    waiting_parts: 'repairs:statusWaitingParts',
    completed: 'repairs:statusCompleted',
    cancelled: 'repairs:statusCancelled',
  }
  const key = keys[status]
  return key ? t(key) : status
}

function RepairSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'h-20 animate-pulse rounded-[var(--radius-card)]',
            'border border-[var(--border)] bg-[var(--bg-sidebar)]',
          )}
        />
      ))}
    </div>
  )
}

export function VehicleHistoryModal({ vehicle, open, onOpenChange }: VehicleHistoryModalProps) {
  const { t } = useTranslation(['vehicles', 'repairs', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const dateLocale = locale === 'ar' ? arSA : fr
  const { data: repairs = [], isLoading } = useVehicleRepairs(vehicle?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t('vehicles:historyTitle', { defaultValue: 'Historique des réparations' })}
            {vehicle ? ` — ${vehicle.plate}` : ''}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <RepairSkeleton />
        ) : repairs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Wrench className="h-10 w-10 text-ink-muted" aria-hidden />
            <p className="text-sm text-ink-secondary">
              {t('vehicles:historyEmpty', { defaultValue: 'Aucune réparation enregistrée' })}
            </p>
          </div>
        ) : (
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
            {repairs.map((raw) => {
              const r = raw as Record<string, unknown>
              const id = String(r.id ?? r._id ?? Math.random())
              const status = String(r.status ?? 'pending')
              const createdAt = r.createdAt ? String(r.createdAt) : undefined
              const line = String(r.diagnosis ?? r.notes ?? '—').trim()
              const total =
                typeof r.total === 'number'
                  ? r.total
                  : typeof r.totalAmount === 'number'
                    ? r.totalAmount
                    : undefined

              return (
                <li
                  key={id}
                  className={cn(
                    'rounded-[var(--radius-card)] border border-[var(--border)]',
                    'bg-[var(--bg-sidebar)] p-3',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant={statusBadgeVariant(status)}>
                      {statusLabel(status, t)}
                    </Badge>
                    {createdAt ? (
                      <span className="text-xs text-ink-muted">
                        {format(new Date(createdAt), 'PP', { locale: dateLocale })}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 truncate text-sm text-ink-secondary">{line}</p>
                  {total != null ? (
                    <p className="mt-1 text-sm font-medium text-ink-primary">
                      {formatTND(total)}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex justify-end pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common:close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
