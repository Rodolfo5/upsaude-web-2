import { Control, FieldPath, FieldValues } from 'react-hook-form'

import { TextareaProps } from '@/components/atoms/Textarea/types'

export interface TextareaFieldProps<T extends FieldValues> extends Omit<
  TextareaProps,
  'name'
> {
  name: FieldPath<T>
  control: Control<T>
  label?: string
}
