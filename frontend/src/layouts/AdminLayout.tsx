import { LogOut } from 'lucide-react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ClayCard, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'
import { useLogout } from '@/hooks/useLogout'
import { cn } from '@/lib/utils'

const links = [
  { to: '/super-admin/dashboard', label: 'Dashboard' },
  { to: '/super-admin/garages', labelKey: 'garages' as const },
  { to: '/super-admin/users', labelKey: 'users' as const },
  { to: '/super-admin/subscriptions', labelKey: 'subscriptions' as const },
  { to: '/super-admin/stats', labelKey: 'stats' as const },
]

export function AdminLayout() {
  const { t } = useTranslation(['superAdmin', 'common'])
  const user = useAuthStore((s) => s.user)
  const handleLogout = useLogout()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'superadmin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-[var(--border)] bg-[var(--bg-surface)]/80 backdrop-blur-clay">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-clay-primary">{t('superAdmin:title')}</p>
            <p className="text-lg font-semibold text-ink-primary">GarageFlow Admin</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/super-admin/dashboard'}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3 py-2 text-sm font-semibold',
                    isActive ? 'bg-clay-primary text-white shadow-clay' : 'bg-[var(--bg-sidebar)] text-ink-secondary',
                  )
                }
              >
                {'label' in l ? l.label : t(`superAdmin:${l.labelKey}`)}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2',
                'text-sm font-medium text-muted-foreground transition-colors duration-150',
                'hover:bg-red-50 hover:text-red-500',
                'dark:hover:bg-red-950/20 dark:hover:text-red-400',
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              {t('common:logout')}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <ClayCard variant="elevated">
          <CardContent className="p-6">
            <Outlet />
          </CardContent>
        </ClayCard>
      </main>
    </div>
  )
}