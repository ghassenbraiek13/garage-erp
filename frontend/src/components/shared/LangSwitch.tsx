import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'
import type { AppLocale } from '@/store/locale'

const flags: Record<AppLocale, string> = {
  fr: '🇫🇷',
  ar: '🇹🇳',
}

const labels: Record<AppLocale, string> = {
  fr: 'FR',
  ar: 'TN',
}

function isLangActive(i18nLang: string, lng: AppLocale): boolean {
  return i18nLang === lng || i18nLang.startsWith(`${lng}-`)
}

export function LangSwitch() {
  const { i18n } = useTranslation()
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
        const active = isLangActive(i18n.language, lng)
        return (
          <Button
            key={lng}
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'relative h-9 rounded-full px-3',
              active && 'bg-clay-primary/10 font-medium text-clay-primary',
            )}
            onClick={() => void switchTo(lng)}
            aria-pressed={active}
          >
            <span className="relative z-10 flex items-center gap-2 text-xs font-semibold">
              <span aria-hidden>{flags[lng]}</span>
              {labels[lng]}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
