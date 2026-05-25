import { Bell } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { arSA, fr } from 'date-fns/locale'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useMarkAllNotificationsRead,
  useNotificationsList,
  useNotificationsUnreadCount,
} from '@/hooks/api/useNotifications'
import { cn } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'

function displayCount(count: number): string {
  if (count > 99) return '99+'
  return String(count)
}

export function NotificationBell() {
  const { t } = useTranslation('notifications')
  const locale = useLocaleStore((s) => s.locale)
  const localeDate = locale === 'ar' ? arSA : fr
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null)
  const { data: apiCount = 0 } = useNotificationsUnreadCount()
  const { data: items = [] } = useNotificationsList()
  const markAll = useMarkAllNotificationsRead()

  const unreadCount = optimisticCount ?? apiCount

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next && unreadCount > 0) {
      setOptimisticCount(0)
      markAll.mutate(undefined, {
        onError: () => setOptimisticCount(null),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: ['notifications'] })
          void qc.invalidateQueries({ queryKey: ['notifications-count'] })
        },
      })
    }
    if (!next) {
      setOptimisticCount(null)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: 'secondary', size: 'icon' }),
          'relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page',
        )}
        aria-label={t('title')}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay-red px-1 text-[10px] font-bold text-white">
            {displayCount(unreadCount)}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t('title')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <DropdownMenuItem disabled className="text-ink-muted">
            {t('empty')}
          </DropdownMenuItem>
        ) : (
          items.map((n) => (
            <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 whitespace-normal">
              <span className="text-sm font-semibold text-ink-primary">{n.title}</span>
              {n.body ? <span className="text-xs text-ink-secondary">{n.body}</span> : null}
              <span className="text-[11px] text-ink-muted">
                {format(new Date(n.createdAt), 'PPp', { locale: localeDate })}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
