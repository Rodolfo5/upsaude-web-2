import {
  GoalEntity,
  OrientationEntity,
  HealthPillarType,
} from '@/types/entities/healthPillar'

export interface OrientationModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  patientId: string
  planId: string
  pillarId: string
  pillarType?: HealthPillarType
  goals: GoalEntity[]
  orientation?: OrientationEntity | null
  defaultGoalId?: string
  defaultArea?: string
  onSuccess?: () => void
}
