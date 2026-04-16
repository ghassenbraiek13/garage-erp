import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
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

const roleTabs: { id: UserRole; label: string; demoEmail: string }[] = [
  { id: 'manager', label: 'Gérant', demoEmail: 'manager@garageflow.app' },
  { id: 'mechanic', label: 'Mécanicien', demoEmail: 'mechanic1@garageflow.app' },
  { id: 'superadmin', label: 'Super Admin', demoEmail: 'superadmin@garageflow.app' },
  { id: 'client', label: 'Client', demoEmail: 'client@garageflow.app' },
]

const demoPasswords: Partial<Record<UserRole, string>> = {
  manager: 'Manager@2024!',
  mechanic: 'Mechanic@2024!',
  superadmin: 'SuperAdmin@2024!',
  client: 'Client@2024!',
}

export function LoginPage(): React.ReactElement {
  const { t } = useTranslation(['auth', 'common'])
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [role, setRole] = useState<UserRole>('manager')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: true },
  })

  const applyRole = (r: UserRole) => {
    setRole(r)
    const tab = roleTabs.find((x) => x.id === r)
    if (tab) form.setValue('email', tab.demoEmail)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      await login(values.email, values.password, role)
      if (role === 'superadmin') navigate('/super-admin/dashboard')
      else if (role === 'client') navigate('/portal')
      else navigate('/')
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null
      toast.error(msg ?? 'Connexion impossible')
    } finally {
      setSubmitting(false)
    }
  })

  const quickDemo = async (r: 'manager' | 'mechanic' | 'client') => {
    const email = roleTabs.find((x) => x.id === r)?.demoEmail ?? ''
    const password = demoPasswords[r] ?? ''
    setRole(r)
    form.setValue('email', email)
    form.setValue('password', password)
    setSubmitting(true)
    try {
      await login(email, password, r)
      navigate(r === 'client' ? '/portal' : '/')
    } catch {
      toast.error('Démo indisponible — lancez le seed backend')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-[100dvh] grid-cols-1 overflow-hidden lg:grid-cols-[55fr_45fr]">
      {/* Left marketing panel — desktop only */}
      <div className="relative hidden min-h-[100dvh] flex-col justify-between lg:flex">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 100% 80% at -10% 110%, #1d4ed8 0%, transparent 50%),
              radial-gradient(ellipse 80% 60% at 110% -10%, #7c3aed 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 50% 50%, #0f172a 0%, #080d1a 100%)
            `,
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-px"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(124,58,237,0.5), transparent)',
          }}
        />

        {/* Decorative glass cards */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-[8%] top-[18%] w-40 -rotate-3 rounded-2xl border border-white/12 p-4 shadow-2xl backdrop-blur-xl"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs text-white/70">Réparations</p>
            <p className="text-2xl font-bold text-white opacity-90">128</p>
            <span className="gf-stat-pulse mt-1 inline-block h-1 w-full rounded-full bg-white/20" />
          </div>
          <div
            className="absolute right-[10%] top-[32%] w-44 rotate-[5deg] rounded-2xl border border-white/12 p-4 shadow-2xl backdrop-blur-xl"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs text-white/70">CA du mois</p>
            <p className="text-2xl font-bold text-white opacity-90">48k €</p>
          </div>
          <div
            className="absolute bottom-[22%] left-[20%] w-36 -rotate-1 rounded-2xl border border-white/12 p-4 shadow-2xl backdrop-blur-xl"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs text-white/70">RDV</p>
            <p className="text-2xl font-bold text-white opacity-90">+24</p>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-10 py-12 xl:px-16">
          <h1 className="text-3xl font-bold tracking-tight text-white xl:text-4xl">GarageFlow</h1>
          <p className="mt-2 max-w-md text-lg text-white/85">Gérez votre garage, développez votre business.</p>
          <ul className="mt-8 space-y-3 text-sm text-white/90">
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-violet-300" />
              Multi-garages, un seul tableau de bord
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-violet-300" />
              Devis, factures et planning en temps réel
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-violet-300" />
              IA diagnostique intégrée
            </li>
          </ul>
        </div>
        <p className="relative z-10 px-10 pb-10 text-xs text-white/50 xl:px-16">
          Trusted by 500+ garages across France & Maghreb
        </p>
      </div>

      {/* Right — form */}
      <div
        className="relative flex min-h-[100dvh] flex-col justify-center px-4 py-8 md:px-10"
        style={{
          background: 'var(--bg-page)',
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 80% 0%, rgba(37,99,235,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 0% 100%, rgba(124,58,237,0.06) 0%, transparent 50%)
          `,
        }}
      >
        <div className="mx-auto w-full max-w-md">
          <p className="mb-1 text-center text-xs text-[var(--text-secondary)] lg:hidden">
            Gérez votre garage, développez votre business.
          </p>
          <div className="mb-6 flex justify-center lg:mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#7c3aed] text-sm font-bold text-white shadow-lg">
              GF
            </div>
          </div>
          <h2 className="text-center text-[28px] font-semibold leading-tight text-[var(--text-primary)]">Bienvenue</h2>
          <p className="mt-1 text-center text-sm text-[var(--text-secondary)]">Connectez-vous à votre espace</p>

          <div
            className="mt-8 rounded-[24px] border border-[var(--border)] p-6 shadow-[var(--shadow-clay)] backdrop-blur-[20px] md:p-10"
            style={{
              background: 'var(--bg-surface)',
              backdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="flex flex-wrap gap-2">
                {roleTabs.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => applyRole(r.id)}
                    className={cn(
                      'rounded-full border px-3 py-2 text-xs font-semibold transition-transform',
                      role === r.id
                        ? 'scale-105 border-transparent bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white shadow-md'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth:email')}</Label>
                <Input id="email" type="email" autoComplete="email" {...form.register('email')} placeholder={roleTabs.find((x) => x.id === role)?.demoEmail} />
                {form.formState.errors.email ? (
                  <p className="text-xs text-[var(--accent-red)]">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth:password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="pe-11"
                    {...form.register('password')}
                  />
                  <button
                    type="button"
                    className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-table-hover)] hover:text-[var(--text-primary)]"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? 'Masquer' : 'Afficher'}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password ? (
                  <p className="text-xs text-[var(--accent-red)]">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <input type="checkbox" className="h-4 w-4 rounded border-[var(--border-strong)]" {...form.register('remember')} />
                  Se souvenir de moi
                </label>
                <Link className="text-sm font-semibold text-[var(--accent-primary)]" to="/forgot-password">
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="h-[52px] w-full rounded-[14px] border-0 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-base font-semibold text-white shadow-lg transition hover:brightness-110 hover:[transform:translateY(-1px)] disabled:opacity-70"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Connexion...
                  </span>
                ) : (
                  t('auth:login')
                )}
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[var(--border)]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[var(--bg-surface)] px-3 text-[var(--text-muted)]">ou continuer avec</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" className="flex-1 border-[var(--border)]" onClick={() => quickDemo('manager')}>
                  Demo Gérant
                </Button>
                <Button type="button" variant="secondary" className="flex-1 border-[var(--border)]" onClick={() => quickDemo('mechanic')}>
                  Demo Mécanicien
                </Button>
                <Button type="button" variant="secondary" className="flex-1 border-[var(--border)]" onClick={() => quickDemo('client')}>
                  Demo Client
                </Button>
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Pas encore de compte ?{' '}
            <Link className="font-semibold text-[var(--accent-primary)]" to="/register">
              Créer un garage
            </Link>
          </p>

          {/* Mobile demo chip */}
          <motion.div
            className="fixed bottom-4 left-4 right-4 z-50 lg:hidden"
            initial={false}
            animate={{ height: demoOpen ? 'auto' : 48 }}
          >
            <button
              type="button"
              onClick={() => setDemoOpen(!demoOpen)}
              className="w-full rounded-full border border-[var(--border)] bg-[var(--bg-modal)] px-4 py-3 text-left text-xs font-medium text-[var(--text-primary)] shadow-clay backdrop-blur-md"
            >
              Demo : appuyer pour se connecter rapidement
            </button>
            {demoOpen ? (
              <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface-solid)] p-3 shadow-lg">
                <Button size="sm" variant="secondary" type="button" onClick={() => quickDemo('manager')}>
                  Gérant
                </Button>
                <Button size="sm" variant="secondary" type="button" onClick={() => quickDemo('mechanic')}>
                  Mécanicien
                </Button>
                <Button size="sm" variant="secondary" type="button" onClick={() => quickDemo('client')}>
                  Client
                </Button>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes gf-stat-pulse {
          0%, 100% { opacity: 0.4; transform: scaleX(0.85); }
          50% { opacity: 1; transform: scaleX(1); }
        }
        .gf-stat-pulse { animation: gf-stat-pulse 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
