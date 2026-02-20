'use client'

import * as React from 'react'

import {
  WEEK_DAYS_ORDER,
  WEEK_DAYS_PT,
  WEEK_DAYS_PT_SHORT,
  WeekDay,
} from '@/constants/weekDays'
import { cn } from '@/lib/utils'

import { DaySelectorProps } from './types'

const DaySelector = React.forwardRef<HTMLDivElement, DaySelectorProps>(
  ({ selectedDays, onChange, disabled = false }, ref) => {
    const toggleDay = (day: WeekDay) => {
      if (disabled) return

      if (selectedDays.includes(day)) {
        // Remove o dia
        onChange(selectedDays.filter((d) => d !== day))
      } else {
        // Adiciona o dia
        onChange([...selectedDays, day])
      }
    }

    return (
      <div ref={ref} className="flex w-full flex-col gap-3">
        <div className="grid grid-cols-7 gap-2">
          {WEEK_DAYS_ORDER.map((day) => {
            const isSelected = selectedDays.includes(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                disabled={disabled}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all duration-200',
                  'hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500',
                  isSelected
                    ? 'border-purple-600 bg-purple-600 text-white shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-purple-50',
                  disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                {/* Versão curta em telas pequenas */}
                <span className="block text-xs font-semibold sm:hidden">
                  {WEEK_DAYS_PT_SHORT[day]}
                </span>
                {/* Versão completa em telas maiores */}
                <span className="hidden text-sm font-semibold sm:block">
                  {WEEK_DAYS_PT[day]}
                </span>
              </button>
            )
          })}
        </div>

        {selectedDays.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Dias selecionados:</span>
            {selectedDays.map((day) => (
              <span
                key={day}
                className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700"
              >
                {WEEK_DAYS_PT[day]}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  },
)

DaySelector.displayName = 'DaySelector'

export { DaySelector }
