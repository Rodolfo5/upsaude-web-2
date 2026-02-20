'use client'

import { Controller } from 'react-hook-form'

import { FormErrorLabel } from '@/components/atoms/FormError/formError'
import { Label } from '@/components/atoms/Label/label'
import { MultiSelect } from '@/components/atoms/MultiSelect/multiSelect'
import { MultiSelectFieldProps } from '@/components/atoms/MultiSelect/types'

const MultiSelectField = ({
  control,
  name,
  label,
  required,
  disabled,
  placeholder,
  options,
}: MultiSelectFieldProps) => {
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

          <MultiSelect
            value={field.value || []}
            onChange={field.onChange}
            disabled={disabled || field.disabled}
            placeholder={placeholder}
            options={options}
          />

          {error && (
            <FormErrorLabel>{error.message?.toString()}</FormErrorLabel>
          )}
        </div>
      )}
    />
  )
}

export default MultiSelectField
