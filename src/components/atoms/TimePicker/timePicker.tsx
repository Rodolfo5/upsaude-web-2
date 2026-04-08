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

import { TimePickerProps } from './types'

const parseTimeToMinutes = (time: string): number => {
  const [hours = '0', minutes = '0'] = time.split(':').map((v) => v.trim())
  const h = Number.parseInt(hours, 10)
  const m = Number.parseInt(minutes, 10)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
  return h * 60 + m
}

const generateTimeOptions = (minTime?: string, maxTime?: string) => {
  const options: { value: string; label: string }[] = []

  const minMinutes = minTime ? parseTimeToMinutes(minTime) : 0
  const maxMinutes = maxTime ? parseTimeToMinutes(maxTime) : 24 * 60 - 1

  // Se maxTime for 00:00, significa que é o turno da noite terminando em meia-noite
  const includesMidnight = maxTime === '00:00'

  // Primeiro, adicionar todas as opções normais do range
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeMinutes = hour * 60 + minute

      // Filtrar opções fora do range mínimo
      if (timeMinutes < minMinutes) {
        continue
      }

      if (includesMidnight) {
        // Para turno da noite com meia-noite, incluir de 18:00 até 23:59
        if (timeMinutes >= minMinutes && timeMinutes <= 23 * 60 + 59) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          options.push({
            value: timeString,
            label: timeString,
          })
        }
      } else {
        // Range normal: de minMinutes até maxMinutes
        if (timeMinutes <= maxMinutes) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          options.push({
            value: timeString,
            label: timeString,
          })
        }
      }
    }
  }

  // Se inclui meia-noite, adicionar 00:00 no final
  if (includesMidnight) {
    options.push({
      value: '00:00',
      label: '00:00',
    })
  }

  return options
}

const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  (
    {
      value,
      onChange,
      disabled = false,
      placeholder = 'Selecione',
      minTime,
      maxTime,
    },
    ref,
  ) => {
    const options = React.useMemo(
      () => generateTimeOptions(minTime, maxTime),
      [minTime, maxTime],
    )

    return (
      <div ref={ref} className={cn('w-full')}>
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-60 bg-white text-gray-700">
            {options.map((option) => (
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

TimePicker.displayName = 'TimePicker'

export { TimePicker }
