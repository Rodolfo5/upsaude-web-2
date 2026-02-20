import { FieldValues, UseControllerProps } from 'react-hook-form'

import { HourPickerProps as BaseHourPickerProps } from '@/components/atoms/HourPicker/types'

export interface HourPickerFieldProps<T extends FieldValues>
  extends UseControllerProps<T>,
    Omit<BaseHourPickerProps, 'value' | 'onChange'> {
  label?: string
}
