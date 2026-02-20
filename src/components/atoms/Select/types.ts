import { ComponentProps } from 'react'

import { ButtonProps } from '../Button/types'
export interface SelectProps {
  options: Array<{
    label: string
    value: string
  }>
  placeholder?: string
  className?: ComponentProps<'div'>['className']
  value: string
  onChange: (value: string) => void
  emptyPlaceholder?: string
  variant?: ButtonProps['variant']
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}
