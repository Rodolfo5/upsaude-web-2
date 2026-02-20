import { ConsultationWithNames } from '@/app/admin/consultas/adminConsultationColumns'
import { AgendaConsultation } from '@/types/entities/agendaConsultation'

export interface RescheduleConsultationModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  consultation: (ConsultationWithNames | AgendaConsultation) | null
  onConfirm: (consultationId: string, date: Date, hour: string) => Promise<void>
}
