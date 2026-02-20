import { ActivityEntity } from '@/types/entities/healthPillar'

export interface ExerciseRecommendationDetailsModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  activity: ActivityEntity | null
}

