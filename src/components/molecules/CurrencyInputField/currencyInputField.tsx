'use client'

import { Controller, FieldValues } from 'react-hook-form'

import { CurrencyInput } from '@/components/atoms/CurrencyInput/currencyInput'
import { CurrencyInputFieldProps } from '@/components/atoms/CurrencyInput/types'
import { FormErrorLabel } from '@/components/atoms/FormError/formError'
import { Label } from '@/components/atoms/Label/label'

const CurrencyInputField = <T extends FieldValues>({
  control,
  name,
  label,
  required,
  disabled,
  placeholder,
}: CurrencyInputFieldProps) => {
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

          <CurrencyInput
            value={field.value}
            onChange={field.onChange}
            disabled={disabled || field.disabled}
            placeholder={placeholder}
          />

          {error && (
            <FormErrorLabel>{error.message?.toString()}</FormErrorLabel>
          )}
        </div>
      )}
    />
  )
}

export default CurrencyInputField
