import { Outlet, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ClayCard, CardContent } from '@/components/ui/card'

export function ClientLayout() {
  const { t } = useTranslation('clientPortal')
  return (
    <div className="min-h-screen bg-page px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-clay-primary">{t('title')}</p>
            <h1 className="text-2xl font-semibold text-ink-primary">GarageFlow</h1>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-semibold">
            <Link className="rounded-full bg-[var(--bg-surface)] px-3 py-2 shadow-clay" to="/portal">
              Accueil
            </Link>
            <Link className="rounded-full bg-[var(--bg-surface)] px-3 py-2 shadow-clay" to="/portal/vehicles">
              {t('myVehicles')}
            </Link>
            <Link className="rounded-full bg-[var(--bg-surface)] px-3 py-2 shadow-clay" to="/portal/book">
              {t('book')}
            </Link>
            <Link className="rounded-full bg-[var(--bg-surface)] px-3 py-2 shadow-clay" to="/portal/coupons">
              {t('coupons')}
            </Link>
          </nav>
        </header>
        <ClayCard variant="elevated">
          <CardContent className="p-6">
            <Outlet />
          </CardContent>
        </ClayCard>
      </div>
    </div>
  )
}
