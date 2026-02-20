'use client'

import { Check, ChevronDown } from 'lucide-react'
import * as React from 'react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { Button } from '../Button/button'

import { SelectProps } from './types'

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      className,
      placeholder = 'Procure...',
      onChange,
      value,
      emptyPlaceholder = 'Nenhum item encontrado.',
      variant,
      icon,
      iconPosition = 'left',
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false)
    const hasIcon = !!icon
    const iconPaddingClass = iconPosition === 'left' ? 'pl-9' : 'pr-9'

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            role="combobox"
            variant={variant}
            aria-expanded={open}
            className={cn(
              'w-full items-center justify-between font-normal hover:bg-transparent',
              hasIcon && iconPaddingClass,
              className,
            )}
          >
            {icon && iconPosition === 'left' && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {icon}
              </span>
            )}

            {value
              ? options.find((option) => option.value === value)?.label
              : placeholder}

            {icon && iconPosition === 'right' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {icon}
              </span>
            )}

            <ChevronDown className="h-5 w-5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] bg-white p-0">
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue: string) => {
                    const newValue = currentValue === value ? '' : option.value
                    if (onChange) {
                      onChange(newValue)
                    }
                    setOpen(false)
                  }}
                  className="text-gray-900 data-[selected=true]:text-gray-900"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    )
  },
)

Select.displayName = 'Select'

export default Select
