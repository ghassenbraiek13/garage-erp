import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[var(--radius-badge)] border px-2.5 py-1 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--bg-sidebar)] text-[var(--text-primary)]',
        primary: 'border-transparent bg-[var(--bg-badge-blue)] text-[var(--text-badge-blue)]',
        success: 'border-transparent bg-[var(--bg-badge-green)] text-[var(--text-badge-green)]',
        warning: 'border-transparent bg-[var(--bg-badge-orange)] text-[var(--text-badge-orange)]',
        danger: 'border-transparent bg-[var(--bg-badge-red)] text-[var(--text-badge-red)]',
        purple: 'border-transparent bg-[color-mix(in_srgb,var(--accent-purple)_18%,transparent)] text-[var(--accent-purple)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
