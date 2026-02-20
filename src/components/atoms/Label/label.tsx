import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

import { LabelProps } from './types'

const labelVariants = cva('font-medium inline-flex items-center', {
  variants: {
    variant: {
      default: 'text-gray-700',
      error: 'text-error-600',
      success: 'text-success-600',
      muted: 'text-gray-500',
    },
    size: {
      sm: 'text-xs gap-1',
      md: 'text-sm gap-1.5',
      lg: 'text-base gap-2',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
    },
    required: {
      true: "after:content-['*'] after:ml-0.5 after:text-error-600",
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    weight: 'medium',
  },
})

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      className,
      variant,
      size,
      weight,
      required,
      disabled,
      children,
      name,
      htmlFor,
      icon,
      iconPosition = 'left',
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'label'

    return (
      <Comp
        ref={ref}
        className={cn(
          labelVariants({
            variant,
            size,
            weight,
            required,
            disabled,
            className,
          }),
        )}
        htmlFor={htmlFor || name}
        aria-disabled={disabled ? 'true' : undefined}
        {...props}
      >
        {icon && iconPosition === 'left' && (
          <span className="inline-flex">{icon}</span>
        )}

        {children}

        {icon && iconPosition === 'right' && (
          <span className="inline-flex">{icon}</span>
        )}
      </Comp>
    )
  },
)

Label.displayName = 'Label'

export { Label, labelVariants }
