import { cva } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

import { TextareaProps } from './types'

export const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300',
        error:
          'border-error-300 focus-visible:border-error-300 focus-visible:ring-error-50',
        success:
          'border-success-300 focus-visible:border-success-300 focus-visible:ring-success-50',
      },
      size: {
        sm: 'min-h-[60px] px-2.5 py-2 text-xs',
        md: 'min-h-[80px] px-3 py-2 text-sm',
        lg: 'min-h-[100px] px-3.5 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'
export default Textarea
