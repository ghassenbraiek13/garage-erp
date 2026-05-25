import { Menu, Search, User } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { LangSwitch } from '@/components/shared/LangSwitch'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { cn } from '@/lib/utils'
import { useLogout } from '@/hooks/useLogout'
import { useAuthStore } from '@/store/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buttonVariants } from '@/components/ui/button'

export function GarageTopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { t } = useTranslation(['common', 'navigation'])
  const [focused, setFocused] = useState(false)
  const user = useAuthStore((s) => s.user)
  const handleLogout = useLogout()
  const navigate = useNavigate()

  const initials = user?.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-surface)]/80 px-3 py-3 backdrop-blur-clay md:px-6">
      <button
        type="button"
        className={cn(
          buttonVariants({ variant: 'secondary', size: 'icon' }),
          'md:hidden rounded-full',
        )}
        onClick={onOpenMobileNav}
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div
        className={cn(
          'relative hidden max-w-[320px] flex-1 transition-[max-width] duration-300 md:flex',
          focused && 'max-w-[480px]',
        )}
      >
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <Input
          aria-label={t('search')}
          placeholder={t('search')}
          className="ps-10"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
        <LangSwitch />
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: 'secondary', size: 'icon' }),
              'rounded-full font-semibold',
            )}
            aria-label="Compte"
          >
            {initials ?? 'GF'}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="h-4 w-4" />
              {t('myProfile', { ns: 'navigation' })}
            </DropdownMenuItem>
            {user?.role === 'manager' ? (
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                {t('settings', { ns: 'navigation' })}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void handleLogout()}>
              {t('logout', { ns: 'common' })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
