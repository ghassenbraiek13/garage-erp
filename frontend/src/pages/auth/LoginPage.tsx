import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
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
import { useAuthStore } from '@/store/auth'
import type { UserRole } from '@/types'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  remember: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

const roles: { id: UserRole; label: string }[] = [
  { id: 'manager', label: 'Gérant' },
  { id: 'mechanic', label: 'Mécanicien' },
  { id: 'cashier', label: 'Caisse' },
  { id: 'superadmin', label: 'Super Admin' },
  { id: 'client', label: 'Client' },
]

export function LoginPage() {
  const { t } = useTranslation(['auth', 'common'])
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [role, setRole] = useState<UserRole>('manager')

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '', remember: true } })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values.email, values.password, role)
      if (role === 'superadmin') navigate('/super-admin')
      else if (role === 'client') navigate('/portal')
      else navigate('/')
    } catch (e) {
      const msg = e && typeof e === 'object' && 'response' in e ? (e as { response?: { data?: { message?: string } } }).response?.data?.message : null
      toast.error(msg ?? 'Connexion impossible')
    }
  })

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-5">
      <div className="relative hidden overflow-hidden lg:col-span-2 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(37,99,235,0.25)_0%,transparent_60%),radial-gradient(ellipse_60%_40%_at_80%_100%,rgba(16,185,129,0.2)_0%,transparent_60%),#0b1224]" />
        <div className="relative z-10 m-auto max-w-md space-y-6 px-8 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold">GF</div>
            <div>
              <p className="text-lg font-semibold">GarageFlow</p>
              <p className="text-sm text-white/70">ERP Automobile</p>
            </div>
          </div>
          <p className="text-sm text-white/80">{t('auth:features')}</p>
          <ul className="space-y-2 text-sm text-white/85">
            <li>• Planning drag & drop</li>
            <li>• Stock intelligent</li>
            <li>• IA diagnostic</li>
          </ul>
        </div>
      </div>

      <div className="col-span-1 flex items-center justify-center px-4 py-10 lg:col-span-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
          <ClayCard variant="elevated">
            <CardHeader>
              <CardTitle>{t('auth:login')}</CardTitle>
              <CardDescription>Accédez à votre atelier</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth:email')}</Label>
                  <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
                  {form.formState.errors.email ? (
                    <p className="text-xs text-clay-red">{form.formState.errors.email.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth:password')}</Label>
                  <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
                  {form.formState.errors.password ? (
                    <p className="text-xs text-clay-red">{form.formState.errors.password.message}</p>
                  ) : null}
                </div>
                <label className="flex items-center gap-2 text-sm text-ink-secondary">
                  <input type="checkbox" className="h-4 w-4" {...form.register('remember')} />
                  {t('common:remember')}
                </label>
                <div className="flex items-center justify-between gap-3">
                  <Link className="text-sm font-semibold text-clay-primary" to="/forgot-password">
                    {t('common:forgot')}
                  </Link>
                  <Button type="submit">{t('auth:login')}</Button>
                </div>
                <p className="text-center text-xs text-ink-muted">{t('common:guest')}</p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={cn(
                        'rounded-full border px-3 py-2 text-xs font-semibold',
                        role === r.id ? 'border-clay-primary bg-clay-primary text-white' : 'border-[var(--border)] bg-[var(--bg-sidebar)]',
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-ink-secondary">
                  Pas encore de compte ?{' '}
                  <Link className="font-semibold text-clay-primary" to="/register">
                    {t('auth:register')}
                  </Link>
                </p>
              </form>
            </CardContent>
          </ClayCard>
        </motion.div>
      </div>
    </div>
  )
}
