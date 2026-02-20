import { type VariantProps } from 'class-variance-authority'
import { ComponentProps, ReactNode } from 'react'

import { labelVariants } from './label'

export interface LabelProps
  extends ComponentProps<'label'>,
    VariantProps<typeof labelVariants> {
  children: ReactNode
  htmlFor?: string
  name?: string
  required?: boolean

  icon?: ReactNode
  iconPosition?: 'left' | 'right'

  asChild?: boolean
}
