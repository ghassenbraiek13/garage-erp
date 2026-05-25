import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import { getApiBaseUrl } from '@/config/env'
import { TooltipProvider } from '@/components/ui/tooltip'
import { i18n } from '@/i18n'
import { useAuthStore } from '@/store/auth'
import { useLocaleStore } from '@/store/locale'
import { useThemeStore } from '@/store/theme'
import { Toaster } from 'sonner'

const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

export function AppProviders({ children }: { children: React.ReactNode }) {
  const hydrateTheme = useThemeStore((s) => s.hydrateFromStorage)
  const hydrateLocale = useLocaleStore((s) => s.hydrateFromStorage)
  const locale = useLocaleStore((s) => s.locale)

  useEffect(() => {
    hydrateTheme()
    hydrateLocale()
    const theme = useThemeStore.getState().theme
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light')
  }, [hydrateLocale, hydrateTheme])

  useEffect(() => {
    void i18n.changeLanguage(locale)
  }, [locale])

  useEffect(() => {
    void (async () => {
      let token: string | undefined
      try {
        const { data } = await axios.post(
          `${getApiBaseUrl()}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        token = data?.data?.accessToken as string | undefined
        if (token) useAuthStore.getState().setAccessToken(token)
      } catch {
        useAuthStore.getState().setAccessToken(null)
        useAuthStore.getState().setUser(null)
      }

      if (token) {
        try {
          const { default: api } = await import('@/utils/api')
          const { data } = await api.get('/auth/me')
          useAuthStore.getState().setUser(data.data.user)
        } catch {
          useAuthStore.getState().setUser(null)
        }
      }
    })()
  }, [])

  return (
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>
        <TooltipProvider>
          {children}
          <Toaster richColors closeButton position="top-right" duration={4000} />
        </TooltipProvider>
      </I18nextProvider>
    </QueryClientProvider>
  )
}
