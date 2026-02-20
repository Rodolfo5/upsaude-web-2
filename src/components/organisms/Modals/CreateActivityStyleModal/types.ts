import { ActivityEntity } from '@/types/entities/healthPillar'

export interface CreateActivityStyleModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  patientId: string
  planId: string
  pillarId: string
  goalId: string
  onSuccess?: (activity: ActivityEntity) => void
}

