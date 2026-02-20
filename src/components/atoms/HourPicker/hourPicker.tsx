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

import { HourPickerProps } from './types'

const generateHourOptions = () => {
  return Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    return { value: hour, label: hour }
  })
}

const generateMinuteOptions = (step: number) => {
  return Array.from({ length: 60 / step }, (_, i) => {
    const minute = (i * step).toString().padStart(2, '0')
    return { value: minute, label: minute }
  })
}

const HourPicker = React.forwardRef<HTMLDivElement, HourPickerProps>(
  ({ value, onChange, minuteStep = 1, disabled = false }, ref) => {
    const hourOptions = React.useMemo(() => generateHourOptions(), [])
    const minuteOptions = React.useMemo(
      () => generateMinuteOptions(minuteStep),
      [minuteStep],
    )

    const [selectedHour, selectedMinute] = value ? value.split(':') : ['', '']

    const handleHourChange = (hour: string) => {
      onChange?.(`${hour}:${selectedMinute || '00'}`)
    }

    const handleMinuteChange = (minute: string) => {
      onChange?.(`${selectedHour || '00'}:${minute}`)
    }

    return (
      <div ref={ref} className={cn('flex items-center gap-2')}>
        <Select
          value={selectedHour}
          onValueChange={handleHourChange}
          disabled={disabled}
        >
          <SelectTrigger className="bg-white text-black">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {hourOptions.map((option) => (
              <SelectItem
                className="cursor-pointer"
                key={option.value}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="font-semibold text-gray-500">:</span>

        <Select
          value={selectedMinute}
          onValueChange={handleMinuteChange}
          disabled={disabled}
        >
          <SelectTrigger className="bg-white text-black">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {minuteOptions.map((option) => (
              <SelectItem
                className="cursor-pointer"
                key={option.value}
                value={option.value}
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

HourPicker.displayName = 'HourPicker'

export { HourPicker }
