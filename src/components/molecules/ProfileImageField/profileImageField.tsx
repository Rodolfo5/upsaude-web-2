import { Controller, FieldValues } from 'react-hook-form'

import { Label } from '@/components/atoms/Label/label'
import { ProfileImageUpload } from '@/components/atoms/ProfileImageUpload/profileImageUpload'

import { ProfileImageFieldProps } from './types'

const ProfileImageField = <T extends FieldValues>({
  name,
  control,
  label,
  disabled,
  ...props
}: ProfileImageFieldProps<T>) => {
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
                className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-light text-gray-700"
              >
                {label}
              </Label>
            )}

            <ProfileImageUpload
              {...props}
              value={field.value}
              onChange={field.onChange}
              disabled={disabled}
              className="rounded-md border border-[#530570] focus:border-purple-600 focus:ring-0"
            />
          </div>
        </div>
      )}
    />
  )
}

export default ProfileImageField
