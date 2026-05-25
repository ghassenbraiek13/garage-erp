import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { GarageSidebar } from '@/components/layout/GarageSidebar'
import { GarageTopBar } from '@/components/layout/GarageTopBar'
import { MobileGarageNav } from '@/components/layout/MobileGarageNav'
import { PageTransition } from '@/components/layout/PageTransition'
import { PwaInstallBanner } from '@/components/shared/PwaInstallBanner'
import { cn } from '@/lib/utils'
import { useLayoutStore } from '@/store/layout'

export function GarageLayout() {
  const user = useAuthStore((s) => s.user)
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed)
  const [sheetOpen, setSheetOpen] = useState(false)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'superadmin') {
    return <Navigate to="/super-admin/dashboard" replace />
  }

  if (user.role === 'client') {
    return <Navigate to="/portal" replace />
  }

  return (
    <div className="min-h-screen">
      <PwaInstallBanner />
      <GarageSidebar />

      <div
        className={cn(
          'flex min-h-screen flex-1 flex-col transition-[padding] duration-300',
          collapsed ? 'md:ps-[72px]' : 'md:ps-[280px]',
        )}
      >
        <GarageTopBar onOpenMobileNav={() => setSheetOpen(true)} />
        <main id="main-content" className="flex-1 px-3 py-4 pb-24 md:px-8 md:py-8 md:pb-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      <MobileGarageNav sheetOpen={sheetOpen} setSheetOpen={setSheetOpen} />
    </div>
  )
}
