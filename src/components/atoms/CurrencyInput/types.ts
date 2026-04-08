import type { Control, FieldValues } from 'react-hook-form'

export interface CurrencyInputProps {
  value?: number
  onChange?: (value: number) => void
  disabled?: boolean
  placeholder?: string
}

export interface CurrencyInputFieldProps {
  control: Control<FieldValues>
  name: string
  label?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
}
