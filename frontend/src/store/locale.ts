import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppLocale = 'fr' | 'ar'

function applyDomLocale(locale: AppLocale) {
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
}

type LocaleStore = {
  locale: AppLocale
  setLocale: (l: AppLocale) => void
  hydrateFromStorage: () => void
}

export const useLocaleStore = create(
  persist<LocaleStore>(
    (set, get) => ({
      locale: 'fr',
      setLocale: (locale) => {
        set({ locale })
        applyDomLocale(locale)
      },
      hydrateFromStorage: () => {
        applyDomLocale(get().locale)
      },
    }),
    {
      name: 'gf-locale',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      partialize: (s) => ({ locale: s.locale }) as any,
      onRehydrateStorage: () => (state) => {
        if (state) applyDomLocale(state.locale)
      },
    },
  ),
)
