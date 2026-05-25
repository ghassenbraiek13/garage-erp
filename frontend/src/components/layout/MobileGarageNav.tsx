import { MoreHorizontal } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SidebarLogoutButton } from '@/components/layout/SidebarLogoutButton'
import { filterGarageNavByRole, GARAGE_NAV_ITEMS } from '@/config/garageNav'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

export function MobileGarageNav({
  sheetOpen,
  setSheetOpen,
}: {
  sheetOpen: boolean
  setSheetOpen: (v: boolean) => void
}) {
  const { t } = useTranslation('navigation')
  const role = useAuthStore((s) => s.user?.role)

  const visibleItems = useMemo(() => filterGarageNavByRole(GARAGE_NAV_ITEMS, role), [role])
  const primaryItems = visibleItems.slice(0, 4)
  const sheetItems = visibleItems.slice(4)

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-between border-t border-[var(--border)] bg-[var(--bg-surface)]/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-clay md:hidden"
        aria-label="Navigation mobile"
      >
        {primaryItems.map((it) => {
          const Icon = it.icon
          return (
            <NavLink
              key={`${it.path}-${it.labelKey}`}
              to={it.path}
              end={it.end ?? it.path === '/'}
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
        {sheetItems.length > 0 ? (
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
        ) : null}
      </nav>

      <AnimatePresence>
        {sheetOpen && sheetItems.length > 0 ? (
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
              <motion.div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--border)]" />
              <motion.div className="grid grid-cols-2 gap-3">
                {sheetItems.map((it) => {
                  const Icon = it.icon
                  return (
                    <NavLink
                      key={`${it.path}-${it.labelKey}`}
                      to={it.path}
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
              </motion.div>
              <motion.div className="mt-4 border-t border-[var(--border)] pt-3">
                <SidebarLogoutButton />
              </motion.div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
