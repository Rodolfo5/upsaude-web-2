import { VariantProps } from 'class-variance-authority'
import { FieldValues, UseControllerProps } from 'react-hook-form'

import { selectVariants } from './selectField'

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
  icon?: React.ReactNode
}

export interface SelectFieldProps<T extends FieldValues>
  extends UseControllerProps<T>,
    VariantProps<typeof selectVariants> {
  options: SelectOption[]
  placeholder?: string
  emptyPlaceholder?: string
  className?: string
  label?: string
  disabled?: boolean
  searchable?: boolean
  multiple?: boolean
  loading?: boolean
  icon?: React.ReactNode
}
