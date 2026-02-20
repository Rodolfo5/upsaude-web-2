import { Control, FieldPath, FieldValues } from 'react-hook-form'

import { DurationPickerProps } from '@/components/atoms/DurationPicker/types'

export interface DurationPickerFieldProps<T extends FieldValues>
  extends Omit<DurationPickerProps, 'value' | 'onChange'> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  required?: boolean
}
