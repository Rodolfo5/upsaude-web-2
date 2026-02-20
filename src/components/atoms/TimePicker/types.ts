export interface TimePickerProps {
  value?: string // formato HH:MM
  onChange?: (time: string) => void
  disabled?: boolean
  placeholder?: string
  minTime?: string // formato HH:MM - horário mínimo permitido
  maxTime?: string // formato HH:MM - horário máximo permitido
}

export interface TimePickerFieldProps {
  control: any
  name: string
  label?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  minTime?: string // formato HH:MM - horário mínimo permitido
  maxTime?: string // formato HH:MM - horário máximo permitido
}
