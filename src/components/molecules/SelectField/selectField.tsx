'use client'

import { cva } from 'class-variance-authority'
import { Check, ChevronDown, Circle } from 'lucide-react'
import * as React from 'react'
import { Controller, FieldValues } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import { FormErrorLabel } from '@/components/atoms/FormError/formError'
import { Label } from '@/components/atoms/Label/label'
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

import { SelectFieldProps } from './types'

const selectVariants = cva(
  'flex w-full items-center justify-between rounded-md border border-[#530570] bg-white text-sm text-gray-700 transition-colors focus:border-purple-600 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-red-500 focus:border-red-500',
        success: 'border-green-500 focus:border-green-500',
      },
      size: {
        sm: 'h-8 px-2 py-1 text-xs',
        md: 'h-10 px-3 py-2 text-sm',
        lg: 'h-12 px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

const SelectField = <T extends FieldValues>({
  control,
  name,
  options,
  placeholder = 'Selecione...',
  emptyPlaceholder = 'Nenhuma opção encontrada.',
  className,
  label,
  variant = 'default',
  size = 'md',
  disabled = false,
  searchable = true,
  multiple = false,
  loading = false,
  icon,
  ...props
}: SelectFieldProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const currentVariant = fieldState.error ? 'error' : variant
        const { error } = fieldState

        return (
          <div className="flex w-full flex-col">
            <div className="relative">
              {label && (
                <Label
                  htmlFor={name}
                  variant={error ? 'error' : 'default'}
                  className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-normal text-gray-700"
                >
                  {label}
                </Label>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    role="combobox"
                    className={cn(
                      selectVariants({
                        variant: currentVariant,
                        size,
                      }),
                      'group font-normal hover:bg-transparent hover:text-gray-700',
                      !field.value && 'text-gray-400',
                      className,
                    )}
                    disabled={disabled || loading}
                  >
                    <div className="flex items-center gap-2 text-gray-700">
                      {icon && <span className="text-gray-400">{icon}</span>}
                      {(() => {
                        if (multiple) {
                          const selectedCount = Array.isArray(field.value)
                            ? field.value.length
                            : 0
                          if (selectedCount === 1) {
                            return '1 item selecionado'
                          }
                          if (selectedCount > 1) {
                            return `${selectedCount} itens selecionados`
                          }
                          return placeholder
                        }

                        const selectedLabel = options.find(
                          (option) => option.value === field.value,
                        )?.label
                        return selectedLabel || placeholder
                      })()}
                    </div>
                    {loading ? (
                      <Circle className="h-4 w-4 animate-spin text-gray-400 opacity-50" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-black opacity-50 group-hover:text-black/50" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="max-h-[300px] w-[--radix-popover-trigger-width] overflow-y-auto bg-white p-0">
                  <Command>
                    {searchable && <CommandInput placeholder={placeholder} />}
                    <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled}
                          onSelect={() => {
                            if (multiple) {
                              const currentValue: string[] = Array.isArray(
                                field.value,
                              )
                                ? field.value
                                : []
                              const newValue = currentValue.includes(
                                option.value,
                              )
                                ? currentValue.filter(
                                    (v: string) => v !== option.value,
                                  )
                                : [...currentValue, option.value]
                              field.onChange(newValue)
                            } else {
                              field.onChange(
                                option.value === field.value
                                  ? ''
                                  : option.value,
                              )
                            }
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 text-black',
                              multiple
                                ? Array.isArray(field.value) &&
                                  field.value.includes(option.value)
                                  ? 'opacity-100'
                                  : 'opacity-0'
                                : field.value === option.value
                                  ? 'opacity-100'
                                  : 'opacity-0',
                            )}
                          />
                          <div className="flex items-center gap-2 text-gray-700">
                            {option.icon && (
                              <span className="text-gray-400">
                                {option.icon}
                              </span>
                            )}
                            {option.label}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {error && (
              <FormErrorLabel className="mt-1">
                {error.message?.toString()}
              </FormErrorLabel>
            )}
          </div>
        )
      }}
      {...props}
    />
  )
}

SelectField.displayName = 'SelectField'

export { SelectField, selectVariants }
