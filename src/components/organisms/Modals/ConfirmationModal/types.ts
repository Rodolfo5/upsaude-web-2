import { ReactNode } from 'react'

import { ButtonProps } from '@/components/atoms/Button/types'

export interface ConfirmationModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  title: string
  description?: string
  content?: ReactNode

  icon?: ReactNode

  action: () => void
  actionLabel: string
  actionButtonVariant?: ButtonProps['variant']
  loading?: boolean

  cancelLabel?: string
}
