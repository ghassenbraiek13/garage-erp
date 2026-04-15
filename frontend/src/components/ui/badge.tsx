import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[var(--radius-badge)] border px-2.5 py-1 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--bg-sidebar)] text-ink-primary',
        primary: 'border-transparent bg-clay-primary/15 text-clay-primary',
        success: 'border-transparent bg-clay-green/15 text-clay-green',
        warning: 'border-transparent bg-clay-orange/15 text-clay-orange',
        danger: 'border-transparent bg-clay-red/15 text-clay-red',
        purple: 'border-transparent bg-clay-purple/15 text-clay-purple',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
