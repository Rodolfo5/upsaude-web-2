'use client'

import { Controller, FieldValues } from 'react-hook-form'

import { FormErrorLabel } from '@/components/atoms/FormError/formError'
import { HourPicker } from '@/components/atoms/HourPicker/hourPicker'
import { Label } from '@/components/atoms/Label/label'

import { HourPickerFieldProps } from './types'

const HourPickerField = <T extends FieldValues>({
  control,
  name,
  label,
  ...props
}: HourPickerFieldProps<T>) => {
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

          <HourPicker
            {...props}
            value={field.value}
            onChange={field.onChange}
            disabled={field.disabled}
          />

          {error && (
            <FormErrorLabel>{error.message?.toString()}</FormErrorLabel>
          )}
        </div>
      )}
    />
  )
}

export default HourPickerField
