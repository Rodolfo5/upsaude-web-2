'use client'

import { Controller, FieldValues } from 'react-hook-form'

import { DurationPicker } from '@/components/atoms/DurationPicker/durationPicker'
import { FormErrorLabel } from '@/components/atoms/FormError/formError'
import { Label } from '@/components/atoms/Label/label'

import { DurationPickerFieldProps } from './types'

const DurationPickerField = <T extends FieldValues>({
  control,
  name,
  label,
  required,
  ...props
}: DurationPickerFieldProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className="flex w-full flex-col gap-2 text-gray-700">
          {label && (
            <Label htmlFor={name} variant={error ? 'error' : 'default'}>
              {label}
              {required && <span className="text-red-500"> *</span>}
            </Label>
          )}

          <DurationPicker
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

export default DurationPickerField
