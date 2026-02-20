import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'
import { NumericFormat, NumericFormatProps } from 'react-number-format'

import { cn } from '@/lib/utils'

import { InputCurrencyProps } from './types'

export const inputCurrencyVariants = cva(
  'flex h-11 w-full items-center gap-2 rounded-lg border px-3 text-sm outline-none ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-gray-300 bg-white focus-within:border-primary-300',
        error: 'border-error-300 bg-white focus-within:border-error-500',
        success: 'border-success-300 bg-white focus-within:border-success-500',
        disabled: 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-70',
      },
      iconPosition: {
        left: 'pl-10',
        right: 'pr-10',
      },
      hasSuffix: {
        true: 'pr-10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const InputCurrency = forwardRef<HTMLInputElement, InputCurrencyProps>(
  (
    {
      className,
      variant,
      currency = 'BRL',
      loading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
      prefix: customPrefix,
      suffix: customSuffix,
      ...props
    },
    ref,
  ) => {
    const currencyConfig: Partial<NumericFormatProps> = {
      thousandSeparator: '.',
      decimalSeparator: ',',
      decimalScale: 2,
      fixedDecimalScale: true,
    }

    switch (currency) {
      case 'USD':
        currencyConfig.thousandSeparator = ','
        currencyConfig.decimalSeparator = '.'
        currencyConfig.prefix = customPrefix || '$ '
        break
      case 'EUR':
        currencyConfig.thousandSeparator = '.'
        currencyConfig.decimalSeparator = ','
        currencyConfig.prefix = customPrefix || '€ '
        break
      case 'JPY':
        currencyConfig.thousandSeparator = ','
        currencyConfig.decimalSeparator = ''
        currencyConfig.decimalScale = 0
        currencyConfig.prefix = customPrefix || '¥ '
        break
      case 'GBP':
        currencyConfig.thousandSeparator = ','
        currencyConfig.decimalSeparator = '.'
        currencyConfig.prefix = customPrefix || '£ '
        break
      default:
        currencyConfig.prefix = customPrefix || 'R$ '
    }

    if (customSuffix) {
      currencyConfig.suffix = customSuffix
    }

    return (
      <div className="relative w-full">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <NumericFormat
          {...props}
          {...currencyConfig}
          className={cn(
            inputCurrencyVariants({
              variant,
              className,
              iconPosition: icon ? iconPosition : undefined,
              hasSuffix: !!currencyConfig.suffix,
            }),
          )}
          getInputRef={ref}
          disabled={disabled || loading}
          type="tel"
        />

        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        {loading && !disabled && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>
    )
  },
)

InputCurrency.displayName = 'InputCurrency'
export default InputCurrency
