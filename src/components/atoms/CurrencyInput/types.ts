export interface CurrencyInputProps {
  value?: number
  onChange?: (value: number) => void
  disabled?: boolean
  placeholder?: string
}

export interface CurrencyInputFieldProps {
  control: any
  name: string
  label?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
}
