import {
  Car,
  Droplets,
  Gauge,
  Info,
  Search,
  Snowflake,
  Sparkles,
  Stethoscope,
  Wrench,
  Zap,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ApiService } from '@/hooks/api/useServices'
import {
  DEFAULT_GROUP_ORDER,
  DEFAULT_PRESTATIONS,
  defaultPrestationKey,
  garagePrestationKey,
  getDefaultPrestationByKey,
  type DefaultPrestation,
} from '@/components/planning/rdvPrestations'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, typeof Wrench> = {
  diagnostic: Stethoscope,
  vidange: Droplets,
  freinage: Gauge,
  pneumatique: Car,
  climatisation: Snowflake,
  electricite: Zap,
  carrosserie: Wrench,
  lavage: Sparkles,
  autre: Wrench,
}

type PortalServiceGridProps = {
  value: string
  onChange: (key: string) => void
  garageServices: ApiService[]
}

export function PortalServiceGrid({ value, onChange, garageServices }: PortalServiceGridProps) {
  const { t } = useTranslation(['clientPortal', 'rdv'])

  const defaultByCategory = useMemo(() => {
    const map = new Map<string, DefaultPrestation[]>()
    for (const p of DEFAULT_PRESTATIONS) {
      const list = map.get(p.category) ?? []
      list.push(p)
      map.set(p.category, list)
    }
    return map
  }, [])

  const selected = getDefaultPrestationByKey(value)
  const isDiagnostic =
    value === defaultPrestationKey('Diagnostic général') ||
    value === defaultPrestationKey('Diagnostic avant achat') ||
    selected?.requiresReport

  const renderCard = (key: string, label: string, description?: string, icon?: typeof Wrench) => {
    const Icon = icon ?? Wrench
    const active = value === key
    return (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        className={cn(
          'flex min-h-[88px] flex-col items-start gap-2 rounded-2xl border p-3 text-start transition-all',
          active
            ? 'border-clay-primary bg-clay-primary/10 ring-2 ring-clay-primary'
            : 'border-[var(--border)] bg-[var(--bg-sidebar)] hover:border-clay-primary/40',
        )}
      >
        <Icon className={cn('h-5 w-5', active ? 'text-clay-primary' : 'text-ink-muted')} aria-hidden />
        <span className="text-sm font-semibold text-ink-primary">{label}</span>
        {description ? <span className="text-xs text-ink-muted line-clamp-2">{description}</span> : null}
      </button>
    )
  }

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {t('rdv:group.diagnostic')}
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DEFAULT_PRESTATIONS.filter((p) => p.category === 'diagnostic').map((p) =>
            renderCard(
              defaultPrestationKey(p.label),
              p.label,
              p.description,
              p.label === 'Diagnostic avant achat' ? Search : Stethoscope,
            ),
          )}
        </div>
      </section>

      {garageServices.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            {t('rdv:groupGarage')}
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {garageServices.map((s) =>
              renderCard(garagePrestationKey(s.id), s.name, s.description, CATEGORY_ICONS[s.category ?? 'autre']),
            )}
          </div>
        </section>
      ) : null}

      {DEFAULT_GROUP_ORDER.filter((c) => c !== 'diagnostic').map((cat) => {
        const items = defaultByCategory.get(cat) ?? []
        if (!items.length) return null
        const Icon = CATEGORY_ICONS[cat] ?? Wrench
        return (
          <section key={cat}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
              {t(`rdv:group.${cat}`)}
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {items.map((p) => renderCard(defaultPrestationKey(p.label), p.label, p.description, Icon))}
            </div>
          </section>
        )
      })}

      {isDiagnostic ? (
        <div
          className={cn(
            'flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700',
            'dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-300',
          )}
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{t('clientPortal:diagnosticBanner')}</p>
        </div>
      ) : null}
    </div>
  )
}
