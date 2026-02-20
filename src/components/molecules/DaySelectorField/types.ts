import { Control, FieldPath, FieldValues } from 'react-hook-form'

import { DaySelectorProps } from '@/components/atoms/DaySelector/types'

export interface DaySelectorFieldProps<T extends FieldValues>
  extends Omit<DaySelectorProps, 'selectedDays' | 'onChange'> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  required?: boolean
}
