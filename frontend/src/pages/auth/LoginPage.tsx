import { zodResolver } from '@hookform/resolvers/zod'
import {
  Calendar,
  Eye,
  EyeOff,
  FileText,
  LayoutDashboard,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react'
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

const featureBullets = [
  {
    icon: LayoutDashboard,
    text: 'Multi-garages, un seul tableau de bord',
  },
  {
    icon: FileText,
    text: 'Devis, factures et planning en temps réel',
  },
  {
    icon: Calendar,
    text: 'Planning et réparations en temps réel',
  },
] as const

const statCards = [
  { label: 'Clients actifs', value: '247', icon: Users },
  { label: 'CA du mois', value: '12 400.000 TND', icon: TrendingUp },
  { label: "RDV aujourd'hui", value: '+8', icon: Calendar },
] as const

export function LoginPage(): React.ReactElement {
  const { t } = useTranslation(['auth', 'common'])
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [role, setRole] = useState<UserRole>('manager')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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
      const user = useAuthStore.getState().user
      switch (user?.role) {
        case 'superadmin':
          navigate('/super-admin/dashboard', { replace: true })
          break
        case 'manager':
          navigate('/', { replace: true })
          break
        case 'mechanic':
          navigate('/tasks', { replace: true })
          break
        case 'cashier':
          navigate('/quotes', { replace: true })
          break
        case 'client':
          navigate('/portal', { replace: true })
          break
        default:
          navigate('/', { replace: true })
      }
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

  const [stat1, stat2, stat3] = statCards
  const StatIcon1 = stat1.icon
  const StatIcon2 = stat2.icon
  const StatIcon3 = stat3.icon

  return (
    <div className="grid min-h-[100dvh] grid-cols-1 overflow-hidden lg:grid-cols-[55fr_45fr]">
      <div className="relative hidden min-h-[100dvh] flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-10 lg:flex">
        <div className="pointer-events-none absolute bottom-10 right-10 text-white opacity-5">
          <Wrench className="h-64 w-64" aria-hidden />
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[8%] top-[18%] w-44 -rotate-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2">
              <StatIcon1 className="h-4 w-4 text-blue-300" />
              <p className="text-xs text-white/60">{stat1.label}</p>
            </div>
            <p className="text-2xl font-bold text-white">{stat1.value}</p>
          </div>
          <div className="absolute right-[10%] top-[32%] w-48 rotate-[5deg] rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2">
              <StatIcon2 className="h-4 w-4 text-blue-300" />
              <p className="text-xs text-white/60">{stat2.label}</p>
            </div>
            <p className="text-2xl font-bold text-white">{stat2.value}</p>
          </div>
          <div className="absolute bottom-[22%] left-[20%] w-40 -rotate-1 rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2">
              <StatIcon3 className="h-4 w-4 text-blue-300" />
              <p className="text-xs text-white/60">{stat3.label}</p>
            </div>
            <p className="text-2xl font-bold text-white">{stat3.value}</p>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center">
          <h1 className="text-3xl font-bold tracking-tight text-white xl:text-4xl">GarageFlow</h1>
          <p className="mt-2 max-w-md text-lg text-white/85">Gérez votre garage, développez votre business.</p>
          <ul className="mt-8 space-y-4">
            {featureBullets.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/80">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                  <Icon className="h-4 w-4 shrink-0 text-blue-400" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/50">
          La solution ERP dédiée aux garages professionnels
        </p>
      </div>

      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-10">
        <div className="mx-auto w-full max-w-md">
          <p className="mb-1 text-center text-xs text-slate-500 lg:hidden">
            Gérez votre garage, développez votre business.
          </p>

          <div className="mb-6 flex justify-center lg:mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-xl font-bold text-white shadow-lg shadow-blue-500/25">
              GF
            </div>
          </div>

          <h2 className="text-center text-[28px] font-semibold leading-tight text-slate-900">Bienvenue</h2>
          <p className="mt-1 text-center text-sm text-slate-500">Connectez-vous à votre espace</p>

          <div className="mt-8 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/80">
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="flex flex-wrap gap-2">
                {roleTabs.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => applyRole(r.id)}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                      role === r.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-500 hover:text-slate-700',
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth:email')}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...form.register('email')}
                  placeholder={roleTabs.find((x) => x.id === role)?.demoEmail}
                />
                {form.formState.errors.email ? (
                  <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
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
                    className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? 'Masquer' : 'Afficher'}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password ? (
                  <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register('remember')} />
                  Se souvenir de moi
                </label>
                <Link className="text-sm font-semibold text-blue-600" to="/forgot-password">
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-700 hover:to-blue-800"
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
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Pas encore de compte ?{' '}
            <Link className="font-semibold text-blue-600" to="/register">
              Créer un garage
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
