import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ClayCard, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatTNDCompact } from '@/utils/currency'

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  iconClassName,
  accent = 'primary',
  pulse,
}: {
  label: string
  value: string
  icon: LucideIcon
  trend?: { positive: boolean; label: string }
  iconClassName?: string
  accent?: 'primary' | 'green' | 'orange' | 'blueSolid'
  pulse?: boolean
}) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(reduce ? value : '0')

  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      return
    }
    const match = value.match(/[\d\s.,]+/)
    if (!match) {
      setDisplay(value)
      return
    }
    const numeric = Number.parseFloat(match[0].replace(/\s/g, '').replace(',', '.'))
    if (Number.isNaN(numeric)) {
      setDisplay(value)
      return
    }
    const start = performance.now()
    const duration = 1200
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - p) ** 3
      const current = Math.round(numeric * eased)
      setDisplay(value.includes('TND') ? formatTNDCompact(current) : String(current))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduce, value])

  const accentMap = {
    primary: 'bg-clay-primary/12 text-clay-primary',
    green: 'bg-clay-green text-white',
    orange: 'bg-clay-orange text-white',
    blueSolid: 'bg-clay-primary text-white',
  } as const

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <ClayCard variant="elevated" className="clay-surface-hover">
        <CardContent className="flex items-start justify-between gap-4 p-5">
          <div className="space-y-2">
            <p className="text-sm text-ink-secondary">{label}</p>
            <p className="text-2xl font-semibold tracking-tight text-ink-primary">{display}</p>
            {trend ? (
              <p
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-semibold',
                  trend.positive ? 'text-clay-green' : 'text-clay-red',
                )}
              >
                {trend.positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {trend.label}
              </p>
            ) : null}
          </div>
          <div
            className={cn(
              'relative flex h-12 w-12 items-center justify-center rounded-2xl',
              accentMap[accent],
              iconClassName,
            )}
          >
            {pulse ? (
              <span className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-clay-primary/40 animate-pulse-ring" />
            ) : null}
            <Icon className="h-6 w-6" aria-hidden />
          </div>
        </CardContent>
      </ClayCard>
    </motion.div>
  )
}
