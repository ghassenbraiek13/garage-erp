import {
  Briefcase,
  Calendar,
  Car,
  FileText,
  Gift,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  Settings,
  Sparkles,
  Store,
  Users,
  Wrench,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const primary = [
  { to: '/', icon: LayoutDashboard, labelKey: 'dashboard' as const },
  { to: '/clients', icon: Users, labelKey: 'clients' as const },
  { to: '/planning', icon: Calendar, labelKey: 'planning' as const },
  { to: '/stock', icon: Package, labelKey: 'stock' as const },
]

const sheetLinks = [
  { to: '/vehicles', icon: Car, labelKey: 'vehicles' as const },
  { to: '/repairs', icon: Wrench, labelKey: 'repairs' as const },
  { to: '/quotes', icon: FileText, labelKey: 'quotes' as const },
  { to: '/chatbot', icon: Sparkles, labelKey: 'ia' as const },
  { to: '/hr', icon: Briefcase, labelKey: 'hr' as const },
  { to: '/loyalty', icon: Gift, labelKey: 'loyalty' as const },
  { to: '/storefront', icon: Store, labelKey: 'storefront' as const },
  { to: '/settings', icon: Settings, labelKey: 'settings' as const },
]

export function MobileGarageNav({
  sheetOpen,
  setSheetOpen,
}: {
  sheetOpen: boolean
  setSheetOpen: (v: boolean) => void
}) {
  const { t } = useTranslation('navigation')

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-between border-t border-[var(--border)] bg-[var(--bg-surface)]/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-clay md:hidden"
        aria-label="Navigation mobile"
      >
        {primary.map((it) => {
          const Icon = it.icon
          return (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 min-w-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold',
                  isActive ? 'text-clay-primary' : 'text-ink-muted',
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{t(it.labelKey)}</span>
            </NavLink>
          )
        })}
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'flex min-h-11 min-w-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold',
            sheetOpen ? 'text-clay-primary' : 'text-ink-muted',
          )}
          onClick={() => setSheetOpen(true)}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>{t('more')}</span>
        </Button>
      </nav>

      <AnimatePresence>
        {sheetOpen ? (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              aria-label="Fermer"
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[20px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-clay backdrop-blur-clay"
            >
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--border)]" />
              <div className="grid grid-cols-2 gap-3">
                {sheetLinks.map((it) => {
                  const Icon = it.icon
                  return (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      onClick={() => setSheetOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-[52px] items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-3 py-2 text-sm font-semibold',
                          isActive && 'border-clay-primary/40 bg-clay-primary/10 text-clay-primary',
                        )
                      }
                    >
                      <Icon className="h-5 w-5" />
                      {t(it.labelKey)}
                    </NavLink>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
