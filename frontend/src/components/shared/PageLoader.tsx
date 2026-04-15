import { Loader2 } from 'lucide-react'
import { ClayCard, CardContent } from '@/components/ui/card'

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-8">
      <ClayCard className="w-full max-w-sm">
        <CardContent className="flex items-center gap-3 p-6">
          <Loader2 className="h-5 w-5 animate-spin text-clay-primary" />
          <p className="text-sm font-medium text-ink-secondary">Chargement…</p>
        </CardContent>
      </ClayCard>
    </div>
  )
}
