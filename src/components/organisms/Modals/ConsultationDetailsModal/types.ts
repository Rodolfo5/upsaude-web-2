import { AgendaConsultation } from '@/types/entities/agendaConsultation'

export interface ConsultationDetailsModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  consultation: AgendaConsultation | null
  onCancel?: (consultationId: string) => void
  onReschedule?: (consultation: AgendaConsultation) => void
  onStartConsultation?: (consultationId: string) => void
}
