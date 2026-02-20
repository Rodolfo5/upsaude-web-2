'use client'

import { Close } from '@mui/icons-material'
import * as React from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { MultiSelectProps } from './types'

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      value = [],
      onChange,
      options,
      disabled = false,
      placeholder = 'Selecione',
    },
    ref,
  ) => {
    const handleSelect = (optionValue: string) => {
      if (value.includes(optionValue)) {
        onChange?.(value.filter((v) => v !== optionValue))
      } else {
        onChange?.([...value, optionValue])
      }
    }

    const handleRemove = (optionValue: string) => {
      onChange?.(value.filter((v) => v !== optionValue))
    }

    const selectedOptions = options.filter((option) =>
      value.includes(option.value),
    )

    return (
      <div ref={ref} className={cn('w-full')}>
        <Select value="" onValueChange={handleSelect} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {options
              .filter((option) => !value.includes(option.value))
              .map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer text-gray-700"
                >
                  {option.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {selectedOptions.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {selectedOptions.map((option) => (
              <span
                key={option.value}
                className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
              >
                {option.label}
                <button
                  type="button"
                  onClick={() => handleRemove(option.value)}
                  className="hover:text-red-500"
                  disabled={disabled}
                >
                  <Close className="h-1 w-1" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    )
  },
)

MultiSelect.displayName = 'MultiSelect'

export { MultiSelect }
