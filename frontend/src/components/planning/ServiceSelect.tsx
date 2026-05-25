import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ApiService, ServiceCategory } from '@/hooks/api/useServices'
import { cn } from '@/lib/utils'

const CATEGORY_ORDER: ServiceCategory[] = [
  'diagnostic',
  'vidange',
  'freinage',
  'lavage',
  'pneumatique',
  'electricite',
  'climatisation',
  'carrosserie',
  'autre',
]

const selectClassName = cn(
  'flex h-11 w-full min-h-11 rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm text-ink-primary shadow-inner backdrop-blur-clay backdrop-saturate-[180] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:cursor-not-allowed disabled:opacity-50',
)

export interface ServiceSelectProps {
  id?: string
  services: ApiService[]
  value: string
  onChange: (serviceId: string) => void
  onServicePick?: (service: ApiService | undefined) => void
  placeholder?: string
  className?: string
}

export function ServiceSelect({
  id = 'service-select',
  services,
  value,
  onChange,
  onServicePick,
  placeholder,
  className,
}: ServiceSelectProps) {
  const { t } = useTranslation('planning')

  const grouped = useMemo(() => {
    const map = new Map<ServiceCategory, ApiService[]>()
    for (const s of services) {
      const cat = (s.category ?? 'autre') as ServiceCategory
      const list = map.get(cat) ?? []
      list.push(s)
      map.set(cat, list)
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({ category: c, items: map.get(c)! }))
  }, [services])

  return (
    <select
      id={id}
      className={cn(selectClassName, className)}
      value={value}
      onChange={(e) => {
        const next = e.target.value
        onChange(next)
        onServicePick?.(services.find((s) => s.id === next))
      }}
    >
      <option value="">{placeholder ?? t('selectService')}</option>
      {grouped.map(({ category, items }) => (
        <optgroup key={category} label={t(`serviceCategory.${category}`)}>
          {items.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.price !== undefined ? ` — ${s.price.toFixed(2)} €` : ''}
              {s.duration ? ` (${s.duration} min)` : ''}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
