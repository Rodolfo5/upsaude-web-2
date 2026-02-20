import { VariantProps } from 'class-variance-authority'
import { ComponentProps, ReactNode } from 'react'

import { inputVariants } from '@/components/atoms/Input/input'

export interface InputMasksProps
  extends Omit<ComponentProps<'input'>, 'size'>,
    VariantProps<typeof inputVariants> {
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  maskType?:
    | 'cpf'
    | 'cnpj'
    | 'cep'
    | 'phone'
    | 'cellphone'
    | 'date'
    | 'time'
    | 'datetime'
    | 'credit-card'
    | 'custom'
  mask?: string | string[]
}
