'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { RangeDatePickerProps } from './types'

const RangeDatePicker = React.forwardRef<HTMLDivElement, RangeDatePickerProps>(
  (
    {
      className,
      placeholder = 'Selecione um período',
      value,
      onSelect,
      ...props
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={cn('grid gap-2', className)}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-full justify-start bg-white text-left font-normal text-black',
                !value && 'bg-white text-black',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value?.from ? (
                value.to ? (
                  <>
                    {format(value.from, 'LLL dd, y', { locale: ptBR })} -{' '}
                    {format(value.to, 'LLL dd, y', { locale: ptBR })}
                  </>
                ) : (
                  format(value.from, 'LLL dd, y', { locale: ptBR })
                )
              ) : (
                <span>{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto bg-white p-0" align="start">
            <Calendar
              className="bg-white text-black"
              mode="range"
              selected={value}
              onSelect={onSelect}
              locale={ptBR}
              {...props}
            />
          </PopoverContent>
        </Popover>
      </div>
    )
  },
)
RangeDatePicker.displayName = 'RangeDatePicker'

export { RangeDatePicker }
