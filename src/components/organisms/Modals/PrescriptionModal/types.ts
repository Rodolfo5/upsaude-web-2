export interface PrescriptionModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  doctorId: string
  patientId: string
  consultationId?: string
  onSuccess?: () => void
}
