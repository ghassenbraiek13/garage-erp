import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email(),
})

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <ClayCard variant="elevated" className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('forgotTitle')}</CardTitle>
          <CardDescription>{t('forgotHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(() => {
              /* mock */
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" type="email" {...form.register('email')} />
            </div>
            <Button className="w-full" type="submit">
              Envoyer le lien
            </Button>
            <p className="text-center text-sm text-ink-secondary">
              <Link className="font-semibold text-clay-primary" to="/login">
                Retour connexion
              </Link>
            </p>
          </form>
        </CardContent>
      </ClayCard>
    </div>
  )
}
