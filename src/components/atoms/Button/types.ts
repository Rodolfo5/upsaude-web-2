import { type VariantProps } from 'class-variance-authority'
import { ReactNode } from 'react'

import { buttonVariants } from './button'

export type Ref = HTMLButtonElement

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  className?: string
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}
