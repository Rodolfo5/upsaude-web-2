import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

import { FormErrorLabelProps } from './types'

const formErrorLabelVariants = cva('flex items-start gap-1.5', {
  variants: {
    variant: {
      error: 'text-error-600',
      warning: 'text-warning-600',
      info: 'text-info-600',
      success: 'text-success-600',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
    spacing: {
      none: '',
      tight: 'mt-0.5',
      normal: 'mt-1',
      loose: 'mt-2',
    },
  },
  defaultVariants: {
    variant: 'error',
    size: 'md',
    spacing: 'normal',
  },
})

const FormErrorLabel = forwardRef<HTMLDivElement, FormErrorLabelProps>(
  (
    {
      className,
      variant,
      size,
      spacing,
      children,
      icon,
      iconPosition = 'left',
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'div'

    return (
      <Comp
        ref={ref}
        className={cn(
          formErrorLabelVariants({ variant, size, spacing, className }),
        )}
        {...props}
      >
        {icon && iconPosition === 'left' && (
          <span className="mt-0.5 inline-flex">{icon}</span>
        )}

        <span className="flex-1 text-red-500">{children}</span>

        {icon && iconPosition === 'right' && (
          <span className="mt-0.5 inline-flex">{icon}</span>
        )}
      </Comp>
    )
  },
)

FormErrorLabel.displayName = 'FormErrorLabel'

export { FormErrorLabel, formErrorLabelVariants }
