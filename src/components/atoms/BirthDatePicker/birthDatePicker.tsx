'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import * as React from 'react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { BirthDatePickerProps } from './types'

const currentYear = new Date().getFullYear()
const years = Array.from(
  { length: currentYear - 1900 + 1 },
  (_, i) => currentYear - i,
)

const months = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const normalizeDate = (value: unknown): Date | null => {
  if (!value) return null

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate()
    return isNaN(date.getTime()) ? null : date
  }

  if (typeof value === 'string') {
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }

  return null
}

const BirthDatePicker = React.forwardRef<HTMLDivElement, BirthDatePickerProps>(
  (
    {
      className,
      placeholder = 'Selecione sua data de nascimento',
      value,
      onSelect,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const normalizedValue = normalizeDate(value)

    const [month, setMonth] = useState<number>(
      normalizedValue ? normalizedValue.getMonth() : new Date().getMonth(),
    )
    const [year, setYear] = useState<number>(
      normalizedValue ? normalizedValue.getFullYear() : 2000,
    )

    useEffect(() => {
      if (normalizedValue) {
        setMonth(normalizedValue.getMonth())
        setYear(normalizedValue.getFullYear())
      }
    }, [normalizedValue])

    const handleMonthChange = (newMonth: string) => {
      setMonth(months.indexOf(newMonth))
    }

    const handleYearChange = (newYear: string) => {
      setYear(parseInt(newYear))
    }

    return (
      <div
        ref={ref}
        className={cn(
          'grid gap-2 rounded-lg border border-gray-700 bg-white',
          className,
        )}
      >
        <Popover>
          <PopoverTrigger asChild disabled={disabled}>
            <Button
              variant={'ghost'}
              className={cn(
                'w-full justify-start text-left font-normal text-black',
                !value && 'bg-white text-muted-foreground',
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {normalizedValue ? (
                format(normalizedValue, 'PPP', { locale: ptBR })
              ) : (
                <span>{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto bg-white p-0" align="center">
            <div className="flex items-center justify-between bg-white p-3">
              <Select value={months[month]} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={year.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem
                      className="bg-white"
                      key={year}
                      value={year.toString()}
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Calendar
              key={'birth-date-picker'}
              mode="single"
              className="bg-white text-black"
              selected={normalizedValue || undefined}
              onSelect={onSelect}
              month={new Date(year, month)}
              onMonthChange={(date) => {
                if (date) {
                  setMonth(date.getMonth())
                  setYear(date.getFullYear())
                }
              }}
              locale={ptBR}
              disabled={(date) => {
                return date > new Date() || date.getFullYear() < 1900
              }}
              {...props}
            />
          </PopoverContent>
        </Popover>
      </div>
    )
  },
)
BirthDatePicker.displayName = 'BirthDatePicker'

export { BirthDatePicker }
