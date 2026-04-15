import { useTranslation } from 'react-i18next'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LangSwitch } from '@/components/shared/LangSwitch'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function SettingsPage() {
  const { t } = useTranslation('common')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-fluid-h1 font-semibold">Paramètres</h1>
        <p className="text-sm text-ink-secondary">Thème, langue et notifications (démo)</p>
      </div>
      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Apparence</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="space-y-2">
            <Label>Thème</Label>
            <ThemeToggle />
          </div>
          <div className="space-y-2">
            <Label>Langue</Label>
            <LangSwitch />
          </div>
        </CardContent>
      </ClayCard>
      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Notifications push (démo)</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              toast.message(t('pushMock'))
            }}
          >
            {t('pushMock')}
          </Button>
        </CardContent>
      </ClayCard>
    </div>
  )
}
