import { create } from 'zustand'

export const useLayoutStore = create<{
  sidebarCollapsed: boolean
  mobileSheetOpen: boolean
  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  setMobileSheetOpen: (v: boolean) => void
}>((set) => ({
  sidebarCollapsed: false,
  mobileSheetOpen: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileSheetOpen: (v) => set({ mobileSheetOpen: v }),
}))
