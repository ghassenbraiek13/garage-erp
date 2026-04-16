import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ClayCard, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const links = [
  { to: '/super-admin/dashboard', label: 'Vue' },
  { to: '/super-admin/garages', label: 'Garages' },
  { to: '/super-admin/users', label: 'Utilisateurs' },
  { to: '/super-admin/stats', label: 'Stats' },
  { to: '/super-admin/subscriptions', label: 'Abonnements' },
]

export function AdminLayout() {
  const { t } = useTranslation('superAdmin')
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-[var(--border)] bg-[var(--bg-surface)]/80 backdrop-blur-clay">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-clay-primary">{t('title')}</p>
            <p className="text-lg font-semibold text-ink-primary">GarageFlow Admin</p>
          </div>
          <nav className="flex flex-wrap gap-2">
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
                {l.label}
              </NavLink>
            ))}
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
