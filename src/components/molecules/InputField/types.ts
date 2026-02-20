import { Control, FieldValues, Path } from 'react-hook-form'

import { InputProps } from '@/components/atoms/Input/types'
import { InputCurrencyProps } from '@/components/atoms/InputCurrency/types'
import { InputMasksProps } from '@/components/atoms/InputMask/types'

type CustomInputProps = Omit<InputProps, 'name'> &
  Omit<InputCurrencyProps, 'name' | 'control'> &
  Omit<InputMasksProps, 'name' | 'control'>

export interface InputFieldProps<T extends FieldValues>
  extends CustomInputProps {
  name: Path<T>
  control: Control<T>
  label?: string
  currency?: string
}
