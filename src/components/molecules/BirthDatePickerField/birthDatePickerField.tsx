'use client'

import { useController } from 'react-hook-form'

import { BirthDatePicker } from '@/components/atoms/BirthDatePicker/birthDatePicker'
import { FormErrorLabel } from '@atoms/FormError/formError'
import { Label } from '@atoms/Label/label'

import { BirthDatePickerFieldProps } from './types'

export default function BirthDatePickerField({
  name,
  control,
  label,
  required,
  placeholder,
  className,
  disabled,
}: BirthDatePickerFieldProps) {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({
    name,
    control,
  })

  return (
    <div className={className}>
      <div className="relative">
        <Label
          required={required}
          htmlFor={name}
          className="absolute -top-2 left-3 z-20 bg-white px-1 text-xs font-normal text-gray-700"
        >
          {label}
        </Label>
        <BirthDatePicker
          value={value}
          onSelect={onChange}
          placeholder={placeholder}
          disabled={disabled}
        />
        {error && <FormErrorLabel>{error.message}</FormErrorLabel>}
      </div>
    </div>
  )
}
