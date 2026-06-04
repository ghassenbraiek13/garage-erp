import type { LucideIcon } from 'lucide-react'
import {
  Calendar,
  Car,
  CheckSquare,
  FileText,
  Gift,
  LayoutDashboard,
  MessageCircle,
  Package,
  Settings,
  Settings2,
  Store,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react'
import type { UserRole } from '@/types'

export type GarageNavLabelKey =
  | 'dashboard'
  | 'clients'
  | 'vehicles'
  | 'repairs'
  | 'planning'
  | 'services'
  | 'quotesInvoices'
  | 'stock'
  | 'tasks'
  | 'team'
  | 'loyalty'
  | 'storefront'
  | 'chatbot'
  | 'settings'

export type GarageNavItem = {
  path: string
  labelKey: GarageNavLabelKey
  icon: LucideIcon
  allowedRoles: UserRole[]
  accent?: boolean
  end?: boolean
}

/** Routes alignées sur router.tsx (/stock, /hr, /loyalty, etc.). */
export const GARAGE_NAV_ITEMS: GarageNavItem[] = [
  {
    path: '/',
    labelKey: 'dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['manager', 'mechanic', 'cashier'],
    end: true,
  },
  {
    path: '/clients',
    labelKey: 'clients',
    icon: Users,
    allowedRoles: ['manager', 'cashier'],
  },
  {
    path: '/vehicles',
    labelKey: 'vehicles',
    icon: Car,
    allowedRoles: ['manager'],
  },
  {
    path: '/repairs',
    labelKey: 'repairs',
    icon: Wrench,
    allowedRoles: ['manager', 'mechanic', 'cashier'],
  },
  {
    path: '/planning',
    labelKey: 'planning',
    icon: Calendar,
    allowedRoles: ['manager', 'mechanic'],
  },
  {
    path: '/services',
    labelKey: 'services',
    icon: Settings2,
    allowedRoles: ['manager'],
  },
  {
    path: '/quotes',
    labelKey: 'quotesInvoices',
    icon: FileText,
    allowedRoles: ['manager', 'cashier'],
  },
  {
    path: '/loyalty',
    labelKey: 'loyalty',
    icon: Gift,
    allowedRoles: ['manager', 'cashier'],
  },
  {
    path: '/stock',
    labelKey: 'stock',
    icon: Package,
    allowedRoles: ['manager', 'mechanic', 'cashier'],
  },
  {
    path: '/hr',
    labelKey: 'hr',
    icon: CheckSquare,
    allowedRoles: ['manager'],
  },
  {
    path: '/tasks',
    labelKey: 'tasks',
    icon: CheckSquare,
    allowedRoles: ['mechanic'],
  },
  {
    path: '/users',
    labelKey: 'team',
    icon: UserCog,
    allowedRoles: ['manager'],
  },
  {
    path: '/storefront',
    labelKey: 'storefront',
    icon: Store,
    allowedRoles: ['manager'],
  },
  {
    path: '/chatbot',
    labelKey: 'chatbot',
    icon: MessageCircle,
    allowedRoles: ['manager', 'cashier'],
    accent: true,
  },
  {
    path: '/settings',
    labelKey: 'settings',
    icon: Settings,
    allowedRoles: ['manager'],
  },
]

export function filterGarageNavByRole(
  items: GarageNavItem[],
  role: string | undefined,
): GarageNavItem[] {
  if (!role) return []
  return items.filter((item) => item.allowedRoles.includes(role as UserRole))
}
