export interface SuspendMedicationModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  medicationName: string
  userId: string
  medicationId: string
  onClose?: () => void
}
