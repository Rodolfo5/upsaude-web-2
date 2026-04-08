import { TrainingPrescriptionEntity } from '@/types/entities/healthPillar'

export interface TrainingPrescriptionModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  patientId: string
  planId: string
  pillarId: string
  activityId: string
  prescription?: TrainingPrescriptionEntity | null
  onSuccess?: () => void
}
