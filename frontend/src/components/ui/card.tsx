import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const clayCardVariants = cva(
  'rounded-[var(--radius-card)] border bg-[var(--bg-surface)] backdrop-blur-clay backdrop-saturate-150 transition-all duration-200 [box-shadow:0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] dark:[box-shadow:0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]',
  {
    variants: {
      variant: {
        default: 'border-[var(--clay-border)]',
        elevated:
          'border-[var(--clay-border)] shadow-clay-lg hover:-translate-y-0.5 hover:shadow-clay-hover dark:hover:shadow-clay-dark-hover',
        outlined: 'border-[var(--border)] bg-transparent',
        ghost: 'border-transparent bg-transparent shadow-none backdrop-blur-0',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface ClayCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof clayCardVariants> {}

export function ClayCard({ className, variant, ...props }: ClayCardProps) {
  return <div className={cn(clayCardVariants({ variant }), className)} {...props} />
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-6 pb-0', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-fluid-h1 font-semibold text-ink-primary', className)} {...props} />
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-ink-secondary', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-4', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}
