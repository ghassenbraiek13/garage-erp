import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const step1 = z.object({
  garageName: z.string().min(2),
  address: z.string().min(4),
})

const step2 = z
  .object({
    adminName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirm: z.string().min(8),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  })

const step3 = z.object({
  plan: z.enum(['mensuel', 'annuel']),
})

export function RegisterPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const form1 = useForm<z.infer<typeof step1>>({ resolver: zodResolver(step1) })
  const form2 = useForm<z.infer<typeof step2>>({ resolver: zodResolver(step2) })
  const form3 = useForm<z.infer<typeof step3>>({ resolver: zodResolver(step3), defaultValues: { plan: 'mensuel' } })

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-5">
      <div className="relative hidden lg:col-span-2 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(37,99,235,0.25)_0%,transparent_60%),#0b1224]" />
      </div>
      <div className="col-span-1 flex items-center justify-center px-4 py-10 lg:col-span-3">
        <ClayCard variant="elevated" className="w-full max-w-xl">
          <CardHeader>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((s) => (
                <div
                  key={s}
                  className={cn(
                    'h-2 flex-1 rounded-full',
                    step >= s ? 'bg-clay-primary' : 'bg-[var(--border)]',
                  )}
                />
              ))}
            </div>
            <CardTitle>{t('register')}</CardTitle>
            <CardDescription>
              {step === 1 ? t('step1') : step === 2 ? t('step2') : t('step3')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 ? (
              <form className="space-y-3" onSubmit={form1.handleSubmit(() => setStep(2))}>
                <div>
                  <Label>Nom du garage</Label>
                  <Input {...form1.register('garageName')} />
                </div>
                <div>
                  <Label>Adresse</Label>
                  <Input {...form1.register('address')} />
                </div>
                <Button type="submit" className="w-full">
                  Continuer
                </Button>
              </form>
            ) : null}

            {step === 2 ? (
              <form className="space-y-3" onSubmit={form2.handleSubmit(() => setStep(3))}>
                <div>
                  <Label>Nom administrateur</Label>
                  <Input {...form2.register('adminName')} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" {...form2.register('email')} />
                </div>
                <div>
                  <Label>Mot de passe</Label>
                  <Input type="password" {...form2.register('password')} />
                </div>
                <div>
                  <Label>Confirmation</Label>
                  <Input type="password" {...form2.register('confirm')} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                    Retour
                  </Button>
                  <Button type="submit" className="flex-1">
                    Continuer
                  </Button>
                </div>
              </form>
            ) : null}

            {step === 3 ? (
              <form className="space-y-3" onSubmit={form3.handleSubmit(() => navigate('/login'))}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(['mensuel', 'annuel'] as const).map((p) => (
                    <label
                      key={p}
                      className={cn(
                        'cursor-pointer rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-sidebar)] p-4 text-sm font-semibold',
                        form3.watch('plan') === p && 'border-clay-primary ring-2 ring-clay-primary/30',
                      )}
                    >
                      <input className="sr-only" type="radio" value={p} {...form3.register('plan')} />
                      {p === 'mensuel' ? 'Mensuel' : 'Annuel'}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(2)}>
                    Retour
                  </Button>
                  <Button type="submit" className="flex-1">
                    Terminer
                  </Button>
                </div>
              </form>
            ) : null}

            <p className="text-center text-sm text-ink-secondary">
              Déjà un compte ?{' '}
              <Link className="font-semibold text-clay-primary" to="/login">
                Connexion
              </Link>
            </p>
          </CardContent>
        </ClayCard>
      </div>
    </div>
  )
}
