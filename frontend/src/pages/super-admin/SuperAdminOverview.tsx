import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockGarages } from '@/mocks/mockGarages'

const data = mockGarages.map((g) => ({ name: g.name.slice(0, 10), revenue: g.subscriptionTier === 'enterprise' ? 42000 : g.subscriptionTier === 'pro' ? 28000 : 12000 }))

export function SuperAdminOverview() {
  const { t } = useTranslation('superAdmin')
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{t('stats')}</h2>
        <p className="text-sm text-ink-secondary">Revenus simulés par garage</p>
      </div>
      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Stacked bars (démo)</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="4 6" stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip />
              <Bar dataKey="revenue" fill="var(--accent-primary)" radius={[8, 8, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </ClayCard>
    </div>
  )
}
