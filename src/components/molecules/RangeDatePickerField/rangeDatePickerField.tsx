'use client'

import { Controller, FieldValues } from 'react-hook-form'

import { FormErrorLabel } from '@/components/atoms/FormError/formError'
import { Label } from '@/components/atoms/Label/label'
import { RangeDatePicker } from '@/components/atoms/RangeDatePicker/rangeDatePicker'

import { RangeDatePickerFieldProps } from './types'

const RangeDatePickerField = <T extends FieldValues>({
  control,
  name,
  label,
  ...props
}: RangeDatePickerFieldProps<T>) => {
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

          <RangeDatePicker
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

export default RangeDatePickerField
