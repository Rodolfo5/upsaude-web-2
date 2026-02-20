export interface ComplementaryConsultationModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  consultationId?: string
  doctorId: string
  patientId: string
  onSuccess: () => void
  isEdit?: boolean
  editData?: {
    specialty: string
    frequencyValue: string
    frequencyUnit: string
    requiredConsultations: string
    reason: string
    planId?: string
  }
}
