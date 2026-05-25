import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLogout } from '@/hooks/useLogout'
import { cn } from '@/lib/utils'

type SidebarLogoutButtonProps = {
  collapsed?: boolean
  className?: string
}

export function SidebarLogoutButton({ collapsed, className }: SidebarLogoutButtonProps) {
  const { t } = useTranslation('common')
  const handleLogout = useLogout()

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2',
        'text-sm font-medium text-muted-foreground transition-colors duration-150',
        'hover:bg-red-50 hover:text-red-500',
        'dark:hover:bg-red-950/20 dark:hover:text-red-400',
        className,
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
      {!collapsed ? <span className="truncate">{t('logout')}</span> : null}
    </button>
  )
}
