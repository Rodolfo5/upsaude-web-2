export interface ChangeRiskClassificationModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  currentRisk: string
  patientId: string
  checkupId?: string
  onSuccess: () => void
}
