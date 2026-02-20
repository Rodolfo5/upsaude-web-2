import { Controller, FieldValues } from 'react-hook-form'

import { FormErrorLabel } from '@/components/atoms/FormError/formError'
import { Label } from '@/components/atoms/Label/label'
import Textarea from '@/components/atoms/Textarea/textarea'

import { TextareaFieldProps } from './types'

const TextareaField = <T extends FieldValues>({
  name,
  control,
  label,
  ...props
}: TextareaFieldProps<T>) => {
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
                className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-normal text-[#49454F]"
              >
                {label}
              </Label>
            )}

            <Textarea
              {...props}
              {...field}
              value={field.value || ''}
              variant={error ? 'error' : props.variant}
              className="rounded-sm border border-[#530570] text-gray-700"
            />
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

export default TextareaField
