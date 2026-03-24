import { Control, FieldValues, Path } from 'react-hook-form'

export interface BirthDatePickerFieldProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}
