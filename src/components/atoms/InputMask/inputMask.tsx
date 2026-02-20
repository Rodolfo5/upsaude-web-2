'use client'

import { forwardRef, useCallback, useEffect, useState } from 'react'

import { inputVariants } from '@/components/atoms/Input/input'
import { cn } from '@/lib/utils'

import { InputMasksProps } from './types'

type WithMaskFn = (
  mask: string | string[],
) => (node: HTMLInputElement | null) => void

const InputMask = forwardRef<HTMLInputElement, InputMasksProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      iconPosition = 'left',
      maskType = 'custom',
      mask,
      ...props
    },
    ref,
  ) => {
    const [withMask, setWithMask] = useState<WithMaskFn | null>(null)

    const hasIcon = !!icon
    const iconPaddingClass = iconPosition === 'left' ? 'pl-9' : 'pr-9'
    const finalMask = getMask(maskType, mask)

    useEffect(() => {
      import('use-mask-input')
        .then((module) => {
          if (module && module.withMask) {
            setWithMask(() => module.withMask)
          } else {
            console.warn('use-mask-input não carregou corretamente')
            setWithMask(() => () => {})
          }
        })
        .catch((err) => {
          console.error("Falha ao carregar o módulo 'use-mask-input':", err)
          // Se falhar, permite digitação sem máscara
          setWithMask(() => () => {})
        })
    }, [])

    const handleRef = useCallback(
      (node: HTMLInputElement | null) => {
        if (withMask && finalMask) {
          try {
            const maskApplier = withMask(finalMask)
            maskApplier(node)
          } catch (error) {
            console.error('Erro ao aplicar máscara:', error)
          }
        }

        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref, finalMask, withMask],
    )

    return (
      <div className="relative w-full">
        {icon && iconPosition === 'left' && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}

        <input
          {...props}
          ref={handleRef}
          className={cn(
            inputVariants({ variant, size, hasIcon, className }),
            hasIcon && iconPaddingClass,
          )}
        />

        {icon && iconPosition === 'right' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}
      </div>
    )
  },
)

InputMask.displayName = 'InputMask'

const getMask = (
  maskType?: InputMasksProps['maskType'],
  customMask?: InputMasksProps['mask'],
) => {
  if (maskType === 'custom') {
    return customMask
  }

  switch (maskType) {
    case 'cpf':
      return '000.000.000-00'
    case 'cnpj':
      return '00.000.000/0000-00'
    case 'date':
      return 'date'
    case 'datetime':
      return 'datetime'
    case 'cep':
      return '99999-999'
    case 'phone':
      return '(99) 9999-9999'
    case 'cellphone':
      return ['(99) 9999-9999', '(99) 99999-9999']
    case 'time':
      return '99:99'
    case 'credit-card':
      return '9999 9999 9999 9999'
    default:
      return undefined
  }
}

export default InputMask
