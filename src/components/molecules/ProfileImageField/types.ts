import { Control, FieldPath, FieldValues } from 'react-hook-form'

export interface ProfileImageFieldProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label?: string
  className?: string
  disabled?: boolean
}
