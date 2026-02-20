'use client'

import { Controller, FieldValues } from 'react-hook-form'

import { DatePicker } from '@/components/atoms/DatePicker/datePicker'
import { FormErrorLabel } from '@/components/atoms/FormError/formError'
import { Label } from '@/components/atoms/Label/label'

import { DatePickerFieldProps } from './types'

const DatePickerField = <T extends FieldValues>({
  control,
  name,
  label,
  ...props
}: DatePickerFieldProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className="flex w-full flex-col gap-1">
          {label && (
            <Label htmlFor={name} variant={error ? 'error' : 'default'}>
              {label}
            </Label>
          )}

          <DatePicker
            {...props}
            value={field.value}
            onSelect={field.onChange}
          />

          {error && (
            <FormErrorLabel>{error.message?.toString()}</FormErrorLabel>
          )}
        </div>
      )}
    />
  )
}

export default DatePickerField
