import { VariantProps } from 'class-variance-authority'
import { ComponentProps, ReactNode } from 'react'

import { inputVariants } from './input'

export interface InputProps
  extends Omit<ComponentProps<'input'>, 'size'>,
    VariantProps<typeof inputVariants> {
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  asChild?: boolean
}
