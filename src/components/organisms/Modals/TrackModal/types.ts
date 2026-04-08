import {
  GoalEntity,
  HealthPillarType,
  TrackEntity,
} from '@/types/entities/healthPillar'

export interface TrackModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  patientId: string
  planId: string
  pillarId: string
  pillarType?: HealthPillarType
  goals: GoalEntity[]
  track?: TrackEntity | null
  defaultGoalId?: string
  onSuccess?: () => void
}
