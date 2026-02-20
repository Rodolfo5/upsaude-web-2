import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

import { InputProps } from './types'

export const inputVariants = cva(
  'flex w-full items-center gap-2 rounded-lg border bg-white text-sm ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 outline-none',
  {
    variants: {
      variant: {
        default:
          'border-gray-300 focus-within:border-primary-300 focus-within:ring-primary-50',
        error:
          'border-error-300 focus-within:border-error-300 focus-within:ring-error-50',
        success:
          'border-success-300 focus-within:border-success-300 focus-within:ring-success-50',
      },
      size: {
        sm: 'h-9 px-2.5',
        md: 'h-10 px-3',
        lg: 'h-11 px-3.5',
      },
      hasIcon: {
        true: 'pl-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      iconPosition = 'left',
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'input'
    const hasIcon = !!icon
    const iconPaddingClass = iconPosition === 'left' ? 'pl-9' : 'pr-9'

    return (
      <div className="relative w-full">
        {icon && iconPosition === 'left' && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}

        <Comp
          ref={ref}
          className={cn(
            inputVariants({ variant, size, hasIcon, className }),
            hasIcon && iconPaddingClass,
          )}
          {...props}
        />

        {icon && iconPosition === 'right' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
