import {
  ChevronLeft,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SidebarLogoutButton } from '@/components/layout/SidebarLogoutButton'
import { filterGarageNavByRole, GARAGE_NAV_ITEMS } from '@/config/garageNav'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useLayoutStore } from '@/store/layout'

export function GarageSidebar() {
  const { t } = useTranslation('navigation')
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar)
  const role = useAuthStore((s) => s.user?.role)

  const visibleItems = filterGarageNavByRole(GARAGE_NAV_ITEMS, role)
  const mainNavItems =
    role === 'mechanic' ? visibleItems.filter((it) => it.path !== '/tasks') : visibleItems
  const mechanicTaskItems =
    role === 'mechanic' ? visibleItems.filter((it) => it.path === '/tasks') : []

  const renderNavItem = (it: (typeof GARAGE_NAV_ITEMS)[number]) => {
    const Icon = it.icon
    const link = (
      <NavLink
        to={it.path}
        end={it.end ?? it.path === '/'}
        className={({ isActive }) =>
          cn(
            'group relative flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-all',
            'hover:bg-clay-primary/10',
            isActive &&
              'bg-clay-primary text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] dark:bg-clay-primary',
            it.accent && !isActive && 'text-clay-purple',
          )
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl',
                isActive ? 'bg-white/15 text-white' : 'bg-clay-primary/10 text-clay-primary',
                it.accent && !isActive && 'bg-clay-purple/15 text-clay-purple',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            {!collapsed ? (
              <motion.span layout className="truncate">
                {t(it.labelKey)}
              </motion.span>
            ) : null}
          </>
        )}
      </NavLink>
    )
    return collapsed ? (
      <Tooltip key={`${it.path}-${it.labelKey}`}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{t(it.labelKey)}</TooltipContent>
      </Tooltip>
    ) : (
      <motion.div key={`${it.path}-${it.labelKey}`}>{link}</motion.div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <motion.aside
        layout
        className={cn(
          'fixed start-0 top-0 z-40 hidden h-full flex-col border-e border-[var(--border)] bg-[var(--bg-sidebar)] backdrop-blur-clay md:flex',
          'shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.55)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]',
        )}
        initial={false}
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.div className="flex items-center gap-3 px-4 py-5">
          <motion.div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay-primary text-sm font-bold text-white shadow-clay">
            GF
          </motion.div>
          {!collapsed ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-primary">GarageFlow</p>
              <p className="truncate text-xs text-ink-muted">ERP Automobile</p>
            </motion.div>
          ) : null}
        </motion.div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2" aria-label="Navigation principale">
          {mainNavItems.map((it) => renderNavItem(it))}
          {mechanicTaskItems.length > 0 ? (
            <>
              {!collapsed ? (
                <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {t('mySpace')}
                </p>
              ) : (
                <div className="my-2 border-t border-[var(--border)]" aria-hidden />
              )}
              {mechanicTaskItems.map((it) => renderNavItem(it))}
            </>
          ) : null}
        </nav>

        <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--bg-sidebar)] p-2">
          <SidebarLogoutButton collapsed={collapsed} />
        </div>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute -end-3 top-24 z-50 h-9 w-9 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] shadow-clay"
          onClick={() => toggleSidebar()}
          aria-label={collapsed ? 'Déplier' : 'Replier'}
        >
          <ChevronLeft className={cn('h-4 w-4 rtl:rotate-180', collapsed && 'rotate-180 rtl:rotate-0')} />
        </Button>
      </motion.aside>
    </TooltipProvider>
  )
}
