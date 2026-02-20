import { type VariantProps } from 'class-variance-authority'
import { ComponentProps, ReactNode } from 'react'

import { formErrorLabelVariants } from './formError'

export interface FormErrorLabelProps
  extends ComponentProps<'div'>,
    VariantProps<typeof formErrorLabelVariants> {
  children: ReactNode

  icon?: ReactNode
  iconPosition?: 'left' | 'right'

  asChild?: boolean
}
