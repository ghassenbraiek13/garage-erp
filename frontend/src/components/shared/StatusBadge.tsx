import { Check, Clock, Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusKey = 'in_progress' | 'completed' | 'pending' | 'cancelled'

const map: Record<StatusKey, { variant: React.ComponentProps<typeof Badge>['variant']; icon: typeof Loader2 }> = {
  in_progress: { variant: 'primary', icon: Loader2 },
  completed: { variant: 'success', icon: Check },
  pending: { variant: 'warning', icon: Clock },
  cancelled: { variant: 'danger', icon: X },
}

export function StatusBadge({ status, className }: { status: StatusKey; className?: string }) {
  const { t } = useTranslation('dashboard')
  const cfg = map[status]
  const Icon = cfg.icon
  const label =
    status === 'in_progress'
      ? t('inProgress')
      : status === 'completed'
        ? t('done')
        : status === 'pending'
          ? t('waiting')
          : t('cancelled')
  return (
    <Badge variant={cfg.variant} className={cn('capitalize', className)}>
      <Icon className={cn('h-3.5 w-3.5', status === 'in_progress' && 'animate-spin')} aria-hidden />
      {label}
    </Badge>
  )
}
