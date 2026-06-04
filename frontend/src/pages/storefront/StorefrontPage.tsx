import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { usePartsList } from '@/hooks/api/useParts'
import { formatTND } from '@/utils/currency'
import { useLocaleStore } from '@/store/locale'

export function StorefrontPage(): React.ReactElement {
  const { t } = useTranslation('storefront')
  const locale = useLocaleStore((s) => s.locale)
  const { data, isLoading, isError, error, refetch } = usePartsList()

  const publicParts = useMemo(() => (data?.items ?? []).filter((p) => p.isPublic).slice(0, 24), [data?.items])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-fluid-h1 font-semibold">{t('title')}</h1>
        <p className="text-sm text-ink-secondary">{t('subtitle')}</p>
      </div>
      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        onRetry={() => void refetch()}
        isEmpty={!isLoading && publicParts.length === 0}
        loading={<TableSkeleton rows={4} />}
        empty={<p className="text-sm text-ink-muted">Aucune pièce publique</p>}
      >
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
                <span className="font-semibold">{formatTND(p.price)}</span>
                <span className="text-ink-secondary">{p.category ?? '—'}</span>
              </CardContent>
            </ClayCard>
          ))}
        </div>
      </QueryBoundary>
    </div>
  )
}
