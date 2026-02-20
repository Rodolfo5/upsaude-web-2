import { FieldValues, UseControllerProps } from 'react-hook-form'

import { DatePickerProps as BaseDatePickerProps } from '@/components/atoms/DatePicker/types'

export interface DatePickerFieldProps<T extends FieldValues>
  extends Omit<UseControllerProps<T>, 'disabled'>,
    Omit<BaseDatePickerProps, 'value' | 'onSelect' | 'disabled'> {
  label?: string
  disabled?: boolean
}
