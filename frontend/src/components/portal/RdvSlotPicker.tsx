import { format, isBefore, isToday } from 'date-fns'
import { arSA, fr } from 'date-fns/locale'
import { Check, LayoutGrid, List } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  buildSlotRange,
  generateSlotTimes,
  slotKey,
  useAvailableSlots,
} from '@/hooks/api/useAvailableSlots'
import { cn } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale'

const DAYS = 14

type RdvSlotPickerProps = {
  serviceId: string | undefined
  selected: Date | null
  onSelect: (d: Date) => void
  view: 'grid' | 'list'
  onViewChange: (v: 'grid' | 'list') => void
  weekOffset: number
  onWeekOffsetChange: (n: number) => void
}

export function RdvSlotPicker({
  serviceId,
  selected,
  onSelect,
  view,
  onViewChange,
  weekOffset,
  onWeekOffsetChange,
}: RdvSlotPickerProps) {
  const { t } = useTranslation('clientPortal')
  const locale = useLocaleStore((s) => s.locale)
  const dateLocale = locale === 'ar' ? arSA : fr
  const now = new Date()

  const { data: unavailable } = useAvailableSlots(serviceId, DAYS)
  const allDays = useMemo(() => buildSlotRange(DAYS), [])
  const weekDays = useMemo(() => allDays.slice(weekOffset * 7, weekOffset * 7 + 7), [allDays, weekOffset])
  const times = useMemo(() => generateSlotTimes(new Date()), [])

  const isUnavailable = (slot: Date) => unavailable?.has(slotKey(slot)) ?? false
  const isPast = (slot: Date) => isBefore(slot, now)

  const isAvailable = (slot: Date) => !isPast(slot) && !isUnavailable(slot)

  const availableByDay = useMemo(() => {
    const map = new Map<string, Date[]>()
    for (const day of allDays) {
      const slots = generateSlotTimes(day).filter(isAvailable)
      if (slots.length) map.set(format(day, 'yyyy-MM-dd'), slots)
    }
    return map
  }, [allDays, unavailable, now])

  const selectedLabel = selected
    ? format(selected, "EEEE d MMMM yyyy 'à' HH:mm", { locale: dateLocale })
    : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg border border-[var(--border)] p-1">
          <Button
            type="button"
            size="sm"
            variant={view === 'grid' ? 'primary' : 'ghost'}
            onClick={() => onViewChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
            {t('slotViewGrid')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === 'list' ? 'primary' : 'ghost'}
            onClick={() => onViewChange('list')}
          >
            <List className="h-4 w-4" />
            {t('slotViewList')}
          </Button>
        </div>
        {view === 'grid' ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={weekOffset <= 0}
              onClick={() => onWeekOffsetChange(weekOffset - 1)}
            >
              {t('slotPrevWeek')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={weekOffset >= 1}
              onClick={() => onWeekOffsetChange(weekOffset + 1)}
            >
              {t('slotNextWeek')}
            </Button>
          </div>
        ) : null}
      </div>

      {view === 'grid' ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-1 text-start text-ink-muted" />
                {weekDays.map((day) => (
                  <th
                    key={day.toISOString()}
                    className={cn(
                      'border-b border-[var(--border)] p-2 text-center font-semibold',
                      isToday(day) && 'text-clay-primary underline decoration-2 underline-offset-4',
                    )}
                  >
                    {format(day, 'EEE d MMM', { locale: dateLocale })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map((timeRef) => {
                const hh = format(timeRef, 'HH:mm')
                return (
                  <tr key={hh}>
                    <td className="p-1 text-ink-muted">{hh}</td>
                    {weekDays.map((day) => {
                      const slot = new Date(day)
                      slot.setHours(timeRef.getHours(), timeRef.getMinutes(), 0, 0)
                      const past = isPast(slot)
                      const unavail = isUnavailable(slot)
                      const avail = isAvailable(slot)
                      const sel = selected && slotKey(selected) === slotKey(slot)
                      return (
                        <td key={slotKey(slot)} className="p-0.5">
                          <button
                            type="button"
                            disabled={!avail}
                            onClick={() => avail && onSelect(slot)}
                            className={cn(
                              'relative h-8 w-full rounded text-[10px] font-medium transition-colors',
                              past && 'cursor-not-allowed bg-[var(--bg-sidebar)] text-ink-muted opacity-50',
                              unavail &&
                                !past &&
                                'cursor-not-allowed bg-red-500/10 text-ink-muted line-through',
                              avail &&
                                'cursor-pointer bg-clay-primary/10 hover:bg-clay-primary/20 text-ink-primary',
                              sel && avail && 'ring-2 ring-clay-primary bg-clay-primary/25',
                            )}
                          >
                            {sel ? <Check className="mx-auto h-3 w-3 text-clay-primary" /> : hh}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="max-h-[360px] space-y-4 overflow-y-auto pe-1">
          {Array.from(availableByDay.entries()).map(([dayKey, slots]) => {
            const day = slots[0]!
            return (
              <div key={dayKey}>
                <p className="mb-2 text-sm font-semibold text-ink-primary">
                  {format(day, 'EEEE d MMMM', { locale: dateLocale })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => {
                    const sel = selected && slotKey(selected) === slotKey(slot)
                    return (
                      <button
                        key={slotKey(slot)}
                        type="button"
                        onClick={() => onSelect(slot)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
                          sel
                            ? 'border-clay-primary bg-clay-primary text-white'
                            : 'border-clay-primary/40 text-clay-primary hover:bg-clay-primary/10',
                        )}
                      >
                        {format(slot, 'HH:mm')}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedLabel ? (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--bg-sidebar)] px-3 py-2 text-sm font-medium text-ink-primary">
          {t('slotSelected', { label: selectedLabel })}
        </p>
      ) : null}
    </div>
  )
}
