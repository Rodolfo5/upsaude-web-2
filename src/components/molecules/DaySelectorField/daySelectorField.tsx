'use client'

import { Controller, FieldValues } from 'react-hook-form'

import { DaySelector } from '@/components/atoms/DaySelector/daySelector'
import { FormErrorLabel } from '@/components/atoms/FormError/formError'
import { Label } from '@/components/atoms/Label/label'

import { DaySelectorFieldProps } from './types'

const DaySelectorField = <T extends FieldValues>({
  control,
  name,
  label,
  required,
  ...props
}: DaySelectorFieldProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className="flex w-full flex-col gap-3">
          {label && (
            <Label htmlFor={name} variant={error ? 'error' : 'default'}>
              {label}
              {required && <span className="text-red-500"> *</span>}
            </Label>
          )}

          <DaySelector
            {...props}
            selectedDays={field.value || []}
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

export default DaySelectorField
