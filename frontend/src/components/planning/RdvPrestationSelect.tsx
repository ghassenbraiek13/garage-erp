import { Search, Stethoscope } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ApiService } from '@/hooks/api/useServices'
import { cn } from '@/lib/utils'
import {
  DEFAULT_GROUP_ORDER,
  DEFAULT_PRESTATIONS,
  defaultPrestationKey,
  garagePrestationKey,
  getDefaultPrestationByKey,
  type DefaultPrestation,
} from '@/components/planning/rdvPrestations'

const selectClassName = cn(
  'flex h-11 w-full min-h-11 items-center justify-between rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm text-ink-primary shadow-inner backdrop-blur-clay backdrop-saturate-[180] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page',
)

export interface RdvPrestationSelectProps {
  id?: string
  value: string
  onChange: (key: string) => void
  garageServices: ApiService[]
  placeholder?: string
}

function DiagnosticIcon({ label }: { label: string }) {
  if (label === 'Diagnostic avant achat') return <Search className="size-4 shrink-0 text-clay-primary" aria-hidden />
  return <Stethoscope className="size-4 shrink-0 text-clay-primary" aria-hidden />
}

export function RdvPrestationSelect({
  id = 'rdv-prestation',
  value,
  onChange,
  garageServices,
  placeholder,
}: RdvPrestationSelectProps) {
  const { t } = useTranslation('rdv')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selectedLabel = useMemo(() => {
    if (!value) return ''
    if (value.startsWith('garage:')) {
      const idPart = value.slice(7)
      return garageServices.find((s) => s.id === idPart)?.name ?? ''
    }
    return getDefaultPrestationByKey(value)?.label ?? ''
  }, [value, garageServices])

  const defaultByCategory = useMemo(() => {
    const map = new Map<string, DefaultPrestation[]>()
    for (const p of DEFAULT_PRESTATIONS) {
      const list = map.get(p.category) ?? []
      list.push(p)
      map.set(p.category, list)
    }
    return map
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pick = (key: string) => {
    onChange(key)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        className={selectClassName}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={cn('truncate text-start', !selectedLabel && 'text-ink-muted')}>
          {selectedLabel || placeholder || t('selectPrestation')}
        </span>
        <span className="text-ink-muted" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <ul
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-1 shadow-clay"
          role="listbox"
        >
          {garageServices.length > 0 ? (
            <li role="presentation">
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {t('groupGarage')}
              </p>
              {garageServices.map((s) => (
                <li key={s.id} role="option" aria-selected={value === garagePrestationKey(s.id)}>
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-start text-sm text-ink-primary hover:bg-[var(--bg-table-hover)]"
                    onClick={() => pick(garagePrestationKey(s.id))}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </li>
          ) : null}

          {DEFAULT_GROUP_ORDER.map((cat) => {
            const items = defaultByCategory.get(cat)
            if (!items?.length) return null
            return (
              <li key={cat} role="presentation">
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {t(`group.${cat}`)}
                </p>
                {items.map((p) => {
                  const key = defaultPrestationKey(p.label)
                  const isDiag = p.requiresReport
                  return (
                    <li key={key} role="option" aria-selected={value === key}>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-start gap-2 rounded-lg px-3 py-2 text-start text-sm hover:bg-[var(--bg-table-hover)]',
                          isDiag && 'bg-clay-primary/5 font-medium',
                        )}
                        onClick={() => pick(key)}
                      >
                        {isDiag ? <DiagnosticIcon label={p.label} /> : null}
                        <span className="flex flex-col gap-0.5">
                          <span className="text-ink-primary">{p.label}</span>
                          {p.description ? (
                            <span className="text-xs font-normal text-ink-muted">{p.description}</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export function getDiagnosticHintKey(value: string): 'general' | 'prePurchase' | null {
  const p = getDefaultPrestationByKey(value)
  if (!p?.requiresReport) return null
  if (p.label === 'Diagnostic avant achat') return 'prePurchase'
  if (p.label === 'Diagnostic général') return 'general'
  return p.hint === 'prePurchase' ? 'prePurchase' : 'general'
}
