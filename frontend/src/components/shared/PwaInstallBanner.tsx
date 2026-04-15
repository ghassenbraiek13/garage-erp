import { Download, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallBanner() {
  const { t } = useTranslation('common')
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler as EventListener)
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener)
  }, [])

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setVisible(false)
    setDeferred(null)
  }

  if (!visible || !deferred) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] p-3 md:inset-x-auto md:bottom-6 md:end-6 md:start-auto md:max-w-md">
      <ClayCard variant="elevated" className="border border-[var(--border)]">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay-primary/15 text-clay-primary">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold text-ink-primary">GarageFlow</p>
            <p className="text-sm text-ink-secondary">{t('installApp')}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" size="sm" onClick={() => void install()}>
                {t('installApp')}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setVisible(false)}>
                {t('installDismiss')}
              </Button>
            </div>
          </div>
          <button
            type="button"
            className={cn(
              'rounded-[var(--radius-btn)] p-2 text-ink-muted hover:bg-[var(--bg-sidebar)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-primary',
            )}
            aria-label={t('close')}
            onClick={() => setVisible(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </CardContent>
      </ClayCard>
    </div>
  )
}
