import type { MedicationEntity } from '@/types/entities/medication'

export interface EditMedicationModalProps {
  isOpen: boolean
  onClose: () => void
  medication: MedicationEntity | null
  onSave: (updates: {
    medicationId: string
    usageClassification: string
    interval?: number
    intervalUnit?: string
    endDate?: Date
  }) => void
  isSaving?: boolean
}
