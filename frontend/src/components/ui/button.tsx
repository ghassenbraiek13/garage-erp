import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[var(--radius-btn)] text-sm font-semibold transition-[transform,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96]',
  {
    variants: {
      variant: {
        primary:
          'bg-clay-primary text-white shadow-clay hover:bg-clay-hover active:translate-y-px',
        secondary:
          'border border-[var(--border)] bg-[var(--bg-surface)] text-ink-primary shadow-clay hover:bg-[var(--bg-sidebar)]',
        ghost: 'text-ink-primary hover:bg-[var(--bg-sidebar)]',
        danger: 'bg-clay-red text-white hover:opacity-95',
        orange: 'bg-clay-orange text-white hover:opacity-95',
        green: 'bg-clay-green text-white hover:opacity-95',
        purple: 'bg-clay-purple text-white hover:opacity-95',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', asChild = false, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }))

    if (asChild) {
      return (
        <Slot ref={ref as never} className={classes} {...props}>
          {props.children}
        </Slot>
      )
    }

    return <button ref={ref} type={type} className={classes} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
