import { BookOpen, Bell, Calendar, Car, Gift, Home, LogOut, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ClayCard, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/auth'
import { useLogout } from '@/hooks/useLogout'
import { cn } from '@/lib/utils'
import { connectSocket, getSocket } from '@/utils/socket'

const CLIENT_NAV = [
  { to: '/portal', icon: Home, labelKey: 'home' as const, end: true },
  { to: '/portal/vehicles', icon: Car, labelKey: 'myVehicles' as const },
  { to: '/portal/booklet', icon: BookOpen, labelKey: 'booklet' as const },
  { to: '/portal/book', icon: Calendar, labelKey: 'book' as const },
  { to: '/portal/coupons', icon: Gift, labelKey: 'coupons' as const },
  { to: '/storefront', icon: Store, labelKey: 'storefront' as const },
]

type RepairNotification = {
  repairId: string
  status: string
  vehicle: { plate?: string; make?: string; model?: string } | null
  message: string
}

function vehicleLabel(v: RepairNotification['vehicle']): string {
  if (!v) return ''
  return [v.make, v.model, v.plate].filter(Boolean).join(' ')
}

function usePortalRepairNotifications() {
  const clientId = useAuthStore((s) => s.user?.clientId)
  const [notifications, setNotifications] = useState<RepairNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!clientId) return

    connectSocket()
    const socket = getSocket()
    socket.emit('join:client', clientId)

    const handler = (data: RepairNotification) => {
      setNotifications((prev) => [data, ...prev].slice(0, 20))
      setUnreadCount((c) => c + 1)
      toast.info(data.message)
    }

    socket.on('repair:notification', handler)
    return () => {
      socket.off('repair:notification', handler)
    }
  }, [clientId])

  return { notifications, unreadCount, clearUnread: () => setUnreadCount(0) }
}

function PortalNotificationBell({
  notifications,
  unreadCount,
  onOpen,
}: {
  notifications: RepairNotification[]
  unreadCount: number
  onOpen: () => void
}) {
  const { t } = useTranslation('clientPortal')

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) onOpen()
      }}
    >
      <DropdownMenuTrigger
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-lg',
          'border border-[var(--border)] bg-[var(--bg-surface)] text-ink-secondary',
          'hover:bg-clay-primary/10 hover:text-clay-primary',
        )}
        aria-label={t('notifications')}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay-red px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t('notifications')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>{t('noNotifications')}</DropdownMenuItem>
        ) : (
          notifications.slice(0, 5).map((n) => (
            <DropdownMenuItem
              key={`${n.repairId}-${n.status}-${n.message}`}
              className="flex flex-col items-start gap-1"
            >
              <span className="text-sm font-medium text-ink-primary">{n.message}</span>
              {vehicleLabel(n.vehicle) ? (
                <span className="text-xs text-ink-muted">{vehicleLabel(n.vehicle)}</span>
              ) : null}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ClientLayout() {
  const { t } = useTranslation(['clientPortal', 'common'])
  const user = useAuthStore((s) => s.user)
  const handleLogout = useLogout()
  const portalNotif = usePortalRepairNotifications()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'client') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-page)]">
      <aside
        className={cn(
          'hidden h-full w-64 min-w-[256px] shrink-0 flex-col',
          'border-e border-[var(--border)] bg-[var(--bg-sidebar)]',
          'md:flex',
        )}
      >
        <div className="flex items-start justify-between border-b border-[var(--border)] p-6">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-clay-primary">
              {t('clientPortal:title')}
            </p>
            <p className="text-lg font-bold text-ink-primary">GarageFlow</p>
          </div>
          <PortalNotificationBell
            notifications={portalNotif.notifications}
            unreadCount={portalNotif.unreadCount}
            onOpen={portalNotif.clearUnread}
          />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Navigation portail client">
          {CLIENT_NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-clay-primary text-white'
                      : 'text-ink-secondary hover:bg-clay-primary/10',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {t(`clientPortal:${item.labelKey}`)}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-[var(--border)] p-4">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2',
              'text-sm font-medium text-ink-muted transition-colors',
              'hover:bg-red-50 hover:text-red-500',
              'dark:hover:bg-red-950/20 dark:hover:text-red-400',
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            <span>{t('common:logout')}</span>
          </button>
        </div>
      </aside>

      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-[var(--bg-page)]">
        <header className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-page)] p-4 md:hidden">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-clay-primary">
                {t('clientPortal:title')}
              </p>
              <h1 className="text-lg font-bold text-ink-primary">GarageFlow</h1>
            </div>
            <PortalNotificationBell
              notifications={portalNotif.notifications}
              unreadCount={portalNotif.unreadCount}
              onOpen={portalNotif.clearUnread}
            />
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-semibold">
            {CLIENT_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3 py-2 shadow-clay',
                    isActive ? 'bg-clay-primary text-white' : 'bg-[var(--bg-surface)]',
                  )
                }
              >
                {t(`clientPortal:${item.labelKey}`)}
              </NavLink>
            ))}
          </nav>
        </header>

        <div className="flex min-h-0 flex-1 flex-col p-6">
          <ClayCard variant="elevated" className="min-h-full flex-1">
            <CardContent className="min-h-full p-6">
              <div className="min-h-full">
                <Outlet />
              </div>
            </CardContent>
          </ClayCard>
        </div>
      </main>
    </div>
  )
}
