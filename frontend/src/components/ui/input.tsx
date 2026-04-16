import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full min-h-11 rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm text-ink-primary shadow-inner backdrop-blur-clay backdrop-saturate-[180] placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'
