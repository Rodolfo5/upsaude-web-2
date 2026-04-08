'use client'

import * as React from 'react'

import Input from '@/components/atoms/Input/input'

import { CurrencyInputProps } from './types'

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, disabled = false, placeholder = '0,00' }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')

    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplayValue(formatCurrency(value))
      }
    }, [value])

    const formatCurrency = (val: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
      }).format(val)
    }

    const parseCurrency = (val: string): number => {
      // Remove tudo exceto números
      const numericValue = val.replace(/[^\d]/g, '')
      // Converte para centavos e depois para reais
      return numericValue ? parseInt(numericValue) / 100 : 0
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const numericValue = parseCurrency(inputValue)

      setDisplayValue(inputValue)
      onChange?.(numericValue)
    }

    const handleBlur = () => {
      if (value !== undefined && value !== null) {
        setDisplayValue(formatCurrency(value))
      }
    }

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full text-gray-700"
        />
      </div>
    )
  },
)

CurrencyInput.displayName = 'CurrencyInput'

export { CurrencyInput }
