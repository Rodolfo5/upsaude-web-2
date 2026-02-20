import { ReactNode } from 'react'

import { ButtonProps } from '@/components/atoms/Button/types'

export interface AddChatModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  title: string
  description?: string
  content?: ReactNode

  icon?: ReactNode

  action: (patientId: string) => void
  actionLabel: string
  actionButtonVariant?: ButtonProps['variant']
  loading?: boolean

  /** IDs de pacientes a excluir da lista (ex: que já têm chat) */
  excludePatientIds?: string[]

  cancelLabel?: string
}
