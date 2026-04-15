import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SuperAdminSubscriptions() {
  const { t } = useTranslation('superAdmin')
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t('subscriptions')}</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {['mensuel', 'annuel'].map((plan) => (
          <ClayCard key={plan} variant="elevated">
            <CardHeader>
              <CardTitle className="text-base capitalize">{plan}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-ink-secondary">Paiement</p>
              <Badge variant="success">OK</Badge>
            </CardContent>
          </ClayCard>
        ))}
      </div>
    </div>
  )
}
