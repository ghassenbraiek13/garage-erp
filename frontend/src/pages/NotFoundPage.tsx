import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <ClayCard variant="elevated" className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>404</CardTitle>
          <CardDescription>La page demandée est introuvable.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/" className="inline-flex">
              Retour au tableau de bord
            </Link>
          </Button>
        </CardContent>
      </ClayCard>
    </div>
  )
}
