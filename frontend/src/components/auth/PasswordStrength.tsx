import { useMemo } from 'react'
import { cn } from '@/lib/utils'

const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong'

export function evaluatePasswordStrength(password: string): PasswordStrengthLevel {
  if (!password) return 'weak'
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  if (strongRegex.test(password)) score += 1
  if (score <= 2) return 'weak'
  if (score <= 4) return 'fair'
  if (score <= 5) return 'good'
  return 'strong'
}

const colors: Record<PasswordStrengthLevel, string> = {
  weak: 'bg-[var(--accent-red)]',
  fair: 'bg-[var(--accent-orange)]',
  good: 'bg-[var(--accent-orange)]',
  strong: 'bg-[var(--accent-green)]',
}

const labels: Record<PasswordStrengthLevel, string> = {
  weak: 'Faible',
  fair: 'Moyen',
  good: 'Bon',
  strong: 'Fort',
}

export function PasswordStrength({ password }: { password: string }): React.ReactElement | null {
  const level = useMemo(() => evaluatePasswordStrength(password), [password])
  const width = level === 'weak' ? '25%' : level === 'fair' ? '50%' : level === 'good' ? '75%' : '100%'
  if (!password) return null
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-table-header)]">
        <div
          className={cn('h-full rounded-full transition-all duration-300 ease-out', colors[level])}
          style={{ width }}
        />
      </div>
      <p className="text-xs text-[var(--text-muted)]">Sécurité : {labels[level]}</p>
    </div>
  )
}
