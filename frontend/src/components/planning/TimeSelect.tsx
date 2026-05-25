import { cn } from '@/lib/utils'

export const TIME_SLOTS: string[] = Array.from({ length: 21 }, (_, i) => {
  const totalMinutes = 8 * 60 + i * 30
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0')
  const m = (totalMinutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
})

/** Ramène une heure « HH:mm » au créneau 30 min inférieur, dans la plage 08:00–18:00. */
export function roundDownToNearestSlot(raw: string | undefined): string {
  if (!raw || !/^\d{1,2}:\d{2}$/.test(raw)) return ''
  const [hs, ms] = raw.split(':')
  const h = Number(hs)
  const m = Number(ms)
  if (Number.isNaN(h) || Number.isNaN(m)) return ''
  let total = h * 60 + m
  total = Math.floor(total / 30) * 30
  const minM = 8 * 60
  const maxM = 18 * 60
  total = Math.max(minM, Math.min(maxM, total))
  const hh = Math.floor(total / 60)
    .toString()
    .padStart(2, '0')
  const mm = (total % 60).toString().padStart(2, '0')
  return `${hh}:${mm}`
}

const selectClassName = cn(
  'flex h-11 w-full min-h-11 rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm text-ink-primary shadow-inner backdrop-blur-clay backdrop-saturate-[180] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:cursor-not-allowed disabled:opacity-50',
)

export type TimeSelectProps = {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
  id?: string
  'aria-invalid'?: boolean
  /** Première option vide (ex. vue mois sans heure préremplie) */
  allowEmpty?: boolean
  emptyLabel?: string
}

export function TimeSelect({
  value,
  onChange,
  disabled,
  id,
  'aria-invalid': ariaInvalid,
  allowEmpty,
  emptyLabel = '',
}: TimeSelectProps) {
  return (
    <select
      id={id}
      className={selectClassName}
      value={value}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      onChange={(e) => onChange(e.target.value)}
    >
      {allowEmpty ? <option value="">{emptyLabel || '—'}</option> : null}
      {TIME_SLOTS.map((slot) => (
        <option key={slot} value={slot}>
          {slot}
        </option>
      ))}
    </select>
  )
}
