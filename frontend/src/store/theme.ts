import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

function applyDomTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

type ThemeStore = {
  theme: ThemeMode
  setTheme: (t: ThemeMode) => void
  toggle: () => void
  hydrateFromStorage: () => void
}

export const useThemeStore = create(
  persist<ThemeStore>(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme })
        applyDomTheme(theme)
      },
      toggle: () => {
        const next: ThemeMode = get().theme === 'light' ? 'dark' : 'light'
        get().setTheme(next)
      },
      hydrateFromStorage: () => {
        applyDomTheme(get().theme)
      },
    }),
    {
      name: 'garageflow-theme',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      partialize: (s) => ({ theme: s.theme }) as any,
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyDomTheme(state.theme)
          return
        }
        try {
          const legacy = localStorage.getItem('gf-theme')
          if (legacy) {
            const p = JSON.parse(legacy) as { state?: { theme?: ThemeMode } }
            if (p.state?.theme) applyDomTheme(p.state.theme)
          }
        } catch {
          /* ignore */
        }
      },
    },
  ),
)
