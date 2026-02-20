import { DiagnosticEntity } from '@/types/entities/diagnostic'

export interface DiagnosticModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  patientId: string
  planId: string
  diagnostic?: DiagnosticEntity | null
  onSuccess?: () => void
}

