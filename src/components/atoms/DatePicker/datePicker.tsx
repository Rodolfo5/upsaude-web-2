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

import { DatePickerProps } from './types'

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      className,
      placeholder = 'Selecione uma data',
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
              variant={'outline'}
              className={cn(
                'w-full justify-start bg-white text-left font-normal text-black',
                !value && 'bg-white text-black',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? (
                format(value, 'PPP', { locale: ptBR })
              ) : (
                <span>{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              className="bg-white text-black"
              mode="single"
              selected={value}
              onSelect={onSelect}
              locale={ptBR}
              initialFocus
              {...props}
            />
          </PopoverContent>
        </Popover>
      </div>
    )
  },
)
DatePicker.displayName = 'DatePicker'

export { DatePicker }
