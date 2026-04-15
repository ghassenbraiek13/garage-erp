import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { GarageSidebar } from '@/components/layout/GarageSidebar'
import { GarageTopBar } from '@/components/layout/GarageTopBar'
import { MobileGarageNav } from '@/components/layout/MobileGarageNav'
import { PageTransition } from '@/components/layout/PageTransition'
import { PwaInstallBanner } from '@/components/shared/PwaInstallBanner'
import { cn } from '@/lib/utils'
import { useLayoutStore } from '@/store/layout'

export function GarageLayout() {
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed)
  const [sheetOpen, setSheetOpen] = useState(false)

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
