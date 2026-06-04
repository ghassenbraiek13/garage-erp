import {
  BookOpen,
  Bell,
  Calendar,
  Car,
  FileText,
  Gift,
  Home,
  LogOut,
  Receipt,
  Store,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
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
import { ChatWidget } from '@/components/chatbot/ChatWidget'
import { connectSocket, getSocket } from '@/utils/socket'

const CLIENT_NAV = [
  { to: '/portal', icon: Home, labelKey: 'home' as const, end: true },
  { to: '/portal/loyalty', icon: Gift, labelKey: 'loyalty' as const },
  { to: '/portal/vehicles', icon: Car, labelKey: 'myVehicles' as const },
  { to: '/portal/quotes', icon: FileText, labelKey: 'quotes' as const },
  { to: '/portal/invoices', icon: Receipt, labelKey: 'invoices' as const },
  { to: '/portal/booklet', icon: BookOpen, labelKey: 'booklet' as const },
  { to: '/portal/book', icon: Calendar, labelKey: 'book' as const },
  { to: '/storefront', icon: Store, labelKey: 'storefront' as const },
]

export type PortalNotifItem = {
  kind: 'repair' | 'coupon' | 'quote' | 'invoice'
  id: string
  title: string
  message: string
  link: string
  createdAt: string
  extra?: string
}

function usePortalRepairNotifications() {
  const clientId = useAuthStore((s) => s.user?.clientId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [items, setItems] = useState<PortalNotifItem[]>([])
  const [unread, setUnread] = useState(0)

  const addItem = (item: PortalNotifItem) => {
    setItems((prev) => [item, ...prev].slice(0, 30))
    setUnread((c) => c + 1)
  }

  useEffect(() => {
    if (!clientId) return

    connectSocket()
    const socket = getSocket()
    socket.emit('join:client', clientId)

    const repairHandler = (data: {
      repairId: string
      message: string
      vehicle?: { plate?: string; make?: string; model?: string } | null
    }) => {
      const vehicleMsg = data.vehicle
        ? [data.vehicle.make, data.vehicle.model, data.vehicle.plate].filter(Boolean).join(' ')
        : ''
      addItem({
        kind: 'repair',
        id: data.repairId,
        title: data.message,
        message: vehicleMsg,
        link: '/portal',
        createdAt: new Date().toISOString(),
      })
      toast.info(data.message)
    }

    const couponHandler = (data: {
      id?: string
      title: string
      message: string
      couponCode?: string
      createdAt?: string
    }) => {
      addItem({
        kind: 'coupon',
        id: data.id ?? `coupon-${Date.now()}`,
        title: data.title,
        message: data.message,
        link: '/portal/loyalty',
        createdAt: data.createdAt ?? new Date().toISOString(),
        extra: data.couponCode,
      })
      toast.success(data.title, {
        description: data.message,
        duration: 8000,
        action: {
          label: 'Voir mes coupons',
          onClick: () => navigate('/portal/loyalty'),
        },
      })
      void queryClient.invalidateQueries({ queryKey: ['loyalty', 'my'] })
    }

    const quoteHandler = (data: {
      quoteId: string
      title: string
      message: string
      number?: string
    }) => {
      addItem({
        kind: 'quote',
        id: data.quoteId,
        title: data.title,
        message: data.message,
        link: '/portal/quotes',
        createdAt: new Date().toISOString(),
        extra: data.number,
      })
      toast.info(data.title, {
        description: data.message,
        duration: 10000,
        action: {
          label: 'Voir le devis',
          onClick: () => navigate('/portal/quotes'),
        },
      })
      void queryClient.invalidateQueries({ queryKey: ['portal', 'quotes'] })
    }

    const invoiceHandler = (data: {
      invoiceId: string
      title: string
      message: string
      number?: string
    }) => {
      addItem({
        kind: 'invoice',
        id: data.invoiceId,
        title: data.title,
        message: data.message,
        link: '/portal/invoices',
        createdAt: new Date().toISOString(),
        extra: data.number,
      })
      toast.info(data.title, {
        description: data.message,
        duration: 10000,
        action: {
          label: 'Voir la facture',
          onClick: () => navigate('/portal/invoices'),
        },
      })
      void queryClient.invalidateQueries({ queryKey: ['portal', 'invoices'] })
    }

    socket.on('repair:notification', repairHandler)
    socket.on('coupon:new', couponHandler)
    socket.on('quote:new', quoteHandler)
    socket.on('invoice:new', invoiceHandler)

    return () => {
      socket.off('repair:notification', repairHandler)
      socket.off('coupon:new', couponHandler)
      socket.off('quote:new', quoteHandler)
      socket.off('invoice:new', invoiceHandler)
    }
  }, [clientId, navigate, queryClient])

  return {
    items,
    unread,
    clearUnread: () => setUnread(0),
  }
}

function notifIcon(kind: PortalNotifItem['kind']) {
  switch (kind) {
    case 'repair':
      return { Icon: Wrench, className: 'text-clay-primary' }
    case 'coupon':
      return { Icon: Gift, className: 'text-clay-green' }
    case 'quote':
      return { Icon: FileText, className: 'text-blue-500' }
    case 'invoice':
      return { Icon: Receipt, className: 'text-clay-purple' }
    default:
      return { Icon: Bell, className: 'text-ink-muted' }
  }
}

function PortalNotificationBell({
  items,
  unread,
  onOpen,
}: {
  items: PortalNotifItem[]
  unread: number
  onOpen: () => void
}) {
  const { t } = useTranslation('clientPortal')
  const navigate = useNavigate()

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [items],
  )

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
        {unread > 0 ? (
          <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay-red px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t('notifications')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sorted.length === 0 ? (
          <DropdownMenuItem disabled>{t('noNotifications')}</DropdownMenuItem>
        ) : (
          sorted.slice(0, 10).map((item) => {
            const { Icon, className } = notifIcon(item.kind)
            const sub =
              item.message.length > 60 ? `${item.message.slice(0, 60)}…` : item.message
            return (
              <DropdownMenuItem
                key={`${item.kind}-${item.id}-${item.createdAt}`}
                className="flex cursor-pointer items-start gap-3 py-2"
                onClick={() => navigate(item.link)}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    'bg-[var(--bg-sidebar)]',
                  )}
                >
                  <Icon className={cn('h-4 w-4', className)} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight text-ink-primary">{item.title}</p>
                  {sub ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-ink-secondary">{sub}</p>
                  ) : null}
                  {item.extra ? (
                    <span
                      className={cn(
                        'mt-1 inline-block rounded-md px-2 py-0.5 font-mono text-xs',
                        'bg-clay-primary/10 text-clay-primary',
                      )}
                    >
                      {item.extra}
                    </span>
                  ) : null}
                </div>
              </DropdownMenuItem>
            )
          })
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

  const bellProps = {
    items: portalNotif.items,
    unread: portalNotif.unread,
    onOpen: portalNotif.clearUnread,
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
          <PortalNotificationBell {...bellProps} />
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
            <PortalNotificationBell {...bellProps} />
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
      <ChatWidget />
    </div>
  )
}
