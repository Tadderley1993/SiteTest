import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:     'bg-[#1D6AFF] text-white hover:bg-[#1D6AFF]/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:     'border border-[rgba(29,106,255,0.35)] bg-transparent text-[#5B96FF] hover:bg-[rgba(29,106,255,0.1)] hover:border-[#1D6AFF]',
        secondary:   'bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.1)] text-[#E8EDF5] hover:bg-[rgba(255,255,255,0.12)]',
        ghost:       'hover:bg-[rgba(255,255,255,0.06)] text-[rgba(232,237,245,0.5)] hover:text-[#E8EDF5]',
        link:        'text-[#1D6AFF] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm:      'h-9 rounded-md px-4 text-xs',
        lg:      'h-12 rounded-md px-8 text-base',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
