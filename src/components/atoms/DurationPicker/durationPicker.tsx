'use client'

import * as React from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { DurationPickerProps } from './types'

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins}min`
  } else if (mins === 0) {
    return `${hours}h`
  } else {
    return `${hours}h ${mins}min`
  }
}

const generateDurationOptions = (
  minDuration: number,
  maxDuration: number,
  step: number,
) => {
  const options: { value: number; label: string }[] = []

  for (let duration = minDuration; duration <= maxDuration; duration += step) {
    options.push({
      value: duration,
      label: formatDuration(duration),
    })
  }

  return options
}

const DurationPicker = React.forwardRef<HTMLDivElement, DurationPickerProps>(
  (
    {
      value,
      onChange,
      disabled = false,
      minDuration = 15,
      maxDuration = 240, // 4 horas
      step = 15,
    },
    ref,
  ) => {
    const options = React.useMemo(
      () => generateDurationOptions(minDuration, maxDuration, step),
      [minDuration, maxDuration, step],
    )

    const handleChange = (newValue: string) => {
      if (!newValue) {
        return
      }

      const parsed = parseInt(newValue, 10)

      if (!Number.isNaN(parsed)) {
        onChange?.(parsed)
      }
    }

    const selectValue =
      value !== undefined && value !== null && !Number.isNaN(value)
        ? value.toString()
        : ''

    return (
      <div ref={ref} className={cn('w-full')}>
        <Select
          value={selectValue}
          onValueChange={handleChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione a duração" />
          </SelectTrigger>
          <SelectContent className="bg-white text-gray-700">
            {options.map((option) => (
              <SelectItem
                className="cursor-pointer text-gray-700"
                key={option.value}
                value={option.value.toString()}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  },
)

DurationPicker.displayName = 'DurationPicker'

export { DurationPicker }
