import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[120px] w-full rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-ink-primary shadow-inner backdrop-blur-clay placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'
