import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'
import type { AppLocale } from '@/store/locale'

const flags: Record<AppLocale, string> = {
  fr: '🇫🇷',
  ar: '🇩🇿',
}

export function LangSwitch() {
  const { i18n } = useTranslation()
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)

  const switchTo = async (next: AppLocale) => {
    setLocale(next)
    await i18n.changeLanguage(next)
  }

  return (
    <div
      className="flex items-center rounded-full border border-[var(--border)] bg-[var(--bg-surface)] p-1 shadow-inner backdrop-blur-clay"
      role="group"
      aria-label="Langue"
    >
      {(['fr', 'ar'] as AppLocale[]).map((lng) => {
        const active = locale === lng
        return (
          <Button
            key={lng}
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'relative h-9 rounded-full px-3',
              active && 'text-white',
            )}
            onClick={() => void switchTo(lng)}
            aria-pressed={active}
          >
            {active ? (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 rounded-full bg-clay-primary shadow-clay"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            ) : null}
            <span className="relative z-10 flex items-center gap-2 text-xs font-semibold">
              <span aria-hidden>{flags[lng]}</span>
              {lng.toUpperCase()}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
