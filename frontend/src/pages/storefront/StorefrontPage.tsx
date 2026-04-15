import { useTranslation } from 'react-i18next'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockParts } from '@/mocks/mockParts'
import { Badge } from '@/components/ui/badge'
import { formatCurrencyEUR } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'

export function StorefrontPage() {
  const { t } = useTranslation('storefront')
  const locale = useLocaleStore((s) => s.locale)
  const publicParts = mockParts.filter((p) => p.visibility === 'public').slice(0, 12)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-fluid-h1 font-semibold">{t('title')}</h1>
        <p className="text-sm text-ink-secondary">{t('subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {publicParts.map((p) => (
          <ClayCard key={p.id} variant="elevated">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{p.name}</CardTitle>
                <p className="text-xs text-ink-muted">{p.reference}</p>
              </div>
              <Badge variant="success">En stock</Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm">
              <span className="font-semibold">{formatCurrencyEUR(p.price, locale)}</span>
              <span className="text-ink-secondary">{p.category}</span>
            </CardContent>
          </ClayCard>
        ))}
      </div>
    </div>
  )
}
