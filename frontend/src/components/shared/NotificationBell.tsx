import { Bell } from 'lucide-react'
import { useMemo } from 'react'
import { format } from 'date-fns'
import { arSA, fr } from 'date-fns/locale'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'
import type { NotificationItem } from '@/types'

const seed: NotificationItem[] = [
  { id: 'n1', title: 'Nouveau RDV', body: 'Peugeot 308 — demain 09:30', createdAt: new Date().toISOString(), read: false },
  { id: 'n2', title: 'Stock bas', body: 'Plaquettes AV < seuil', createdAt: new Date().toISOString(), read: false },
  { id: 'n3', title: 'Devis accepté', body: 'DEV-104 — Renault Clio', createdAt: new Date().toISOString(), read: true },
]

export function NotificationBell() {
  const locale = useLocaleStore((s) => s.locale)
  const localeDate = locale === 'ar' ? arSA : fr
  const unread = useMemo(() => seed.filter((n) => !n.read).length, [])
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: 'secondary', size: 'icon' }),
          'relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page',
        )}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay-red px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {seed.map((n) => (
          <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 whitespace-normal">
            <span className="text-sm font-semibold text-ink-primary">{n.title}</span>
            <span className="text-xs text-ink-secondary">{n.body}</span>
            <span className="text-[11px] text-ink-muted">
              {format(new Date(n.createdAt), 'PPp', { locale: localeDate })}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
