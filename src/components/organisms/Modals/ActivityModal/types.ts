import {
  ActivityEntity,
  GoalEntity,
  HealthPillarType,
} from '@/types/entities/healthPillar'

export interface ActivityModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  patientId: string
  planId: string
  pillarId: string
  pillarType: HealthPillarType
  goals: GoalEntity[]
  activity?: ActivityEntity | null
  defaultGoalId?: string
  defaultActivityName?: string
  onSuccess?: () => void
}
