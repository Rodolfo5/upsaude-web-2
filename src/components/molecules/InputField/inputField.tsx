import { Controller, FieldValues } from 'react-hook-form'

import { FormErrorLabel } from '@/components/atoms/FormError/formError'
import Input from '@/components/atoms/Input/input'
import InputCurrency from '@/components/atoms/InputCurrency/inputCurrency'
import InputMask from '@/components/atoms/InputMask/inputMask'
import { Label } from '@/components/atoms/Label/label'

import { InputFieldProps } from './types'

// Função para aplicar máscara de CPF
const applyCpfMask = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  const limited = numbers.slice(0, 11)

  if (limited.length <= 3) return limited
  if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`
  if (limited.length <= 9)
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`
  return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
}

// Função para aplicar máscara de CEP
const applyCepMask = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  const limited = numbers.slice(0, 8)

  if (limited.length <= 5) return limited
  return `${limited.slice(0, 5)}-${limited.slice(5)}`
}

// Função para aplicar máscara de telefone/celular
const applyPhoneMask = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  const limited = numbers.slice(0, 11)

  if (limited.length <= 2) return `(${limited}`
  if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
  if (limited.length <= 10)
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
}

const InputField = <T extends FieldValues>({
  name,
  control,
  label,
  currency,
  mask,
  maskType,
  ...props
}: InputFieldProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className="flex w-full flex-col">
          <div className="relative">
            {label && (
              <Label
                htmlFor={name}
                variant={error ? 'error' : 'default'}
                className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-normal text-gray-700"
              >
                {label}
              </Label>
            )}

            {(() => {
              if (currency) {
                return (
                  <InputCurrency
                    {...props}
                    {...field}
                    currency={currency}
                    defaultValue={field.value || ''}
                    onValueChange={(values) =>
                      field.onChange(values.floatValue)
                    }
                    variant={error ? 'error' : props.variant}
                    className="rounded-md border border-[#530570] text-gray-700 focus:border-purple-600 focus:ring-0"
                  />
                )
              }

              // Tratamento especial para CPF
              if (maskType === 'cpf') {
                return (
                  <Input
                    {...props}
                    value={field.value || ''}
                    onChange={(e) => {
                      const masked = applyCpfMask(e.target.value)
                      field.onChange(masked)
                    }}
                    variant={error ? 'error' : props.variant}
                    className="rounded-md border border-[#530570] text-gray-700 focus:border-purple-600 focus:ring-0"
                  />
                )
              }

              // Tratamento especial para CEP
              if (maskType === 'cep') {
                return (
                  <Input
                    {...props}
                    value={field.value || ''}
                    onChange={(e) => {
                      const masked = applyCepMask(e.target.value)
                      field.onChange(masked)
                    }}
                    variant={error ? 'error' : props.variant}
                    className="rounded-md border border-[#530570] text-gray-700 focus:border-purple-600 focus:ring-0"
                  />
                )
              }

              // Tratamento especial para telefone/celular
              if (maskType === 'phone' || maskType === 'cellphone') {
                return (
                  <Input
                    {...props}
                    value={field.value || ''}
                    onChange={(e) => {
                      const masked = applyPhoneMask(e.target.value)
                      field.onChange(masked)
                    }}
                    variant={error ? 'error' : props.variant}
                    className="rounded-md border border-[#530570] text-gray-700 focus:border-purple-600 focus:ring-0"
                  />
                )
              }

              if (mask || maskType) {
                return (
                  <InputMask
                    {...props}
                    {...field}
                    value={field.value || ''}
                    onChange={field.onChange}
                    mask={mask}
                    maskType={maskType}
                    variant={error ? 'error' : props.variant}
                    className="rounded-md border border-[#530570] text-gray-700 focus:border-purple-600 focus:ring-0"
                  />
                )
              }

              return (
                <Input
                  {...field}
                  {...props}
                  value={field.value || ''}
                  variant={error ? 'error' : props.variant}
                  className="rounded-sm border border-[#530570] text-gray-700 focus:border-purple-600 focus:ring-0"
                />
              )
            })()}
          </div>

          {error && (
            <FormErrorLabel className="mt-1">
              {error.message?.toString()}
            </FormErrorLabel>
          )}
        </div>
      )}
    />
  )
}

export default InputField
