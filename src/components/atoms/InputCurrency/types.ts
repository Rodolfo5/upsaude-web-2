import { VariantProps } from 'class-variance-authority'
import { NumericFormatProps } from 'react-number-format'

import { inputCurrencyVariants } from './inputCurrency'

export type SupportedCurrencies = 'BRL' | 'USD' | 'EUR' | 'JPY' | 'GBP' | string

export interface InputCurrencyProps
  extends Omit<
      NumericFormatProps,
      'onChange' | 'onBlur' | 'value' | 'name' | 'ref'
    >,
    VariantProps<typeof inputCurrencyVariants> {
  currency?: SupportedCurrencies
  locale?: string
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}
