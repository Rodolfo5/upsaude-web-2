'use client'

import { Controller, FieldValues } from 'react-hook-form'

import { FormErrorLabel } from '@/components/atoms/FormError/formError'
import { Label } from '@/components/atoms/Label/label'
import { TimePicker } from '@/components/atoms/TimePicker/timePicker'
import { TimePickerFieldProps } from '@/components/atoms/TimePicker/types'

const TimePickerField = <T extends FieldValues>({
  control,
  name,
  label,
  required,
  disabled,
  placeholder,
  minTime,
  maxTime,
}: TimePickerFieldProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className="flex w-full flex-col gap-2">
          {label && (
            <Label htmlFor={name} variant={error ? 'error' : 'default'}>
              {label}
              {required && <span className="text-red-500"> *</span>}
            </Label>
          )}

          <TimePicker
            value={field.value}
            onChange={field.onChange}
            disabled={disabled || field.disabled}
            placeholder={placeholder}
            minTime={minTime}
            maxTime={maxTime}
          />

          {error && (
            <FormErrorLabel>{error.message?.toString()}</FormErrorLabel>
          )}
        </div>
      )}
    />
  )
}

export default TimePickerField
