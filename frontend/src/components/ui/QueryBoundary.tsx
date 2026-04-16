import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type QueryBoundaryProps = {
  isLoading: boolean
  isError: boolean
  error?: Error | null
  onRetry: () => void
  isEmpty?: boolean
  loading: React.ReactNode
  empty: React.ReactNode
  children: React.ReactNode
}

export function QueryBoundary({
  isLoading,
  isError,
  error,
  onRetry,
  isEmpty,
  loading,
  empty,
  children,
}: QueryBoundaryProps): React.ReactElement {
  if (isLoading) return <>{loading}</>
  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface-solid)] p-8 text-center"
        role="alert"
      >
        <AlertCircle className="h-10 w-10 text-[var(--accent-red)]" aria-hidden />
        <p className="text-sm text-[var(--text-secondary)]">
          {error?.message ?? 'Une erreur est survenue lors du chargement.'}
        </p>
        <Button type="button" variant="secondary" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    )
  }
  if (isEmpty) return <>{empty}</>
  return <>{children}</>
}
