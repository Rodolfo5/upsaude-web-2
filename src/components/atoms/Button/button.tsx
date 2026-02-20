import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

import { ButtonProps, Ref } from './types'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2',
  {
    variants: {
      variant: {
        success: 'bg-primary-600 rounded-full text-white hover:bg-primary-700',
        destructive: 'bg-error-600 rounded-full text-black hover:bg-error-700',
        'secondary-gray':
          'bg-white rounded-full text-gray-800 hover:bg-gray-200 border border-purple-600',
        'secondary-color':
          'bg-primary-50 rounded-full text-primary-700 hover:bg-primary-100 border border-primary-200',
        ghost: 'rounded-full text-gray-600',
        link: 'text-primary-600 rounded-full underline-offset-4 hover:underline',
        outline:
          'border border-[#792EBD] rounded-full text-[#792EBD] hover:bg-primary-600 hover:text-white',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'success',
      size: 'md',
    },
  },
)

const Button = forwardRef<Ref, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        {loading ? (
          <>{loadingText && <span>{loadingText}</span>}</>
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
