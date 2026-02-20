import { FieldValues, UseControllerProps } from 'react-hook-form'

import { RangeDatePickerProps as BaseRangeDatePickerProps } from '@/components/atoms/RangeDatePicker/types'

export interface RangeDatePickerFieldProps<T extends FieldValues>
  extends Omit<UseControllerProps<T>, 'disabled'>,
    Omit<BaseRangeDatePickerProps, 'value' | 'onSelect' | 'disabled'> {
  label?: string
  disabled?: boolean
}
