import { useMemo } from 'react'
import {
  Calendar,
  Car,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Sparkles,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useLayoutStore } from '@/store/layout'

type NavItem = {
  to: string
  icon: typeof LayoutDashboard
  labelKey:
    | 'dashboard'
    | 'clients'
    | 'team'
    | 'vehicles'
    | 'repairs'
    | 'quotes'
    | 'stock'
    | 'planning'
    | 'ia'
  accent: boolean
}

export function GarageSidebar() {
  const { t } = useTranslation('navigation')
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar)
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const items = useMemo((): NavItem[] => {
    const core: NavItem[] = [
      { to: '/', icon: LayoutDashboard, labelKey: 'dashboard', accent: false },
      { to: '/clients', icon: Users, labelKey: 'clients', accent: false },
    ]
    const team: NavItem[] =
      user?.role === 'manager'
        ? [{ to: '/users', icon: UserCog, labelKey: 'team', accent: false }]
        : []
    const rest: NavItem[] = [
      { to: '/vehicles', icon: Car, labelKey: 'vehicles', accent: false },
      { to: '/repairs', icon: Wrench, labelKey: 'repairs', accent: false },
      { to: '/quotes', icon: FileText, labelKey: 'quotes', accent: false },
      { to: '/stock', icon: Package, labelKey: 'stock', accent: false },
      { to: '/planning', icon: Calendar, labelKey: 'planning', accent: false },
      { to: '/chatbot', icon: Sparkles, labelKey: 'ia', accent: true },
    ]
    return [...core, ...team, ...rest]
  }, [user?.role])

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
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay-primary text-sm font-bold text-white shadow-clay">
            GF
          </div>
          {!collapsed ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-primary">GarageFlow</p>
              <p className="truncate text-xs text-ink-muted">ERP Automobile</p>
            </motion.div>
          ) : null}
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2" aria-label="Navigation principale">
          {items.map((it) => {
            const Icon = it.icon
            const link = (
              <NavLink
                to={it.to}
                end={it.to === '/'}
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
              <Tooltip key={it.to}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{t(it.labelKey)}</TooltipContent>
              </Tooltip>
            ) : (
              <div key={it.to}>{link}</div>
            )
          })}
        </nav>

        <div className="border-t border-[var(--border)] p-2">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-ink-secondary hover:bg-clay-primary/10',
                isActive && 'text-clay-primary',
              )
            }
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-surface)]">
              <Settings className="h-5 w-5" />
            </span>
            {!collapsed ? <span className="truncate">{t('settings')}</span> : null}
          </NavLink>
          <Button
            variant="ghost"
            className="mt-1 w-full justify-start gap-3 rounded-2xl px-3 text-ink-secondary hover:bg-clay-red/10 hover:text-clay-red"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-surface)]">
              <LogOut className="h-5 w-5" />
            </span>
            {!collapsed ? <span className="truncate">{t('logout')}</span> : null}
          </Button>
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
