export interface MultiSelectProps {
  value?: string[]
  onChange?: (values: string[]) => void
  options: { value: string; label: string }[]
  disabled?: boolean
  placeholder?: string
}

export interface MultiSelectFieldProps {
  control: any
  name: string
  label?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  options: { value: string; label: string }[]
}
