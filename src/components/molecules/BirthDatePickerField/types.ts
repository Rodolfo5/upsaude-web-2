/* eslint-disable @typescript-eslint/no-explicit-any */
import { Control } from 'react-hook-form'

export interface BirthDatePickerFieldProps {
  name: string
  control: Control<any>
  label: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}
