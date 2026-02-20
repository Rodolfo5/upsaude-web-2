import { GoalEntity } from '@/types/entities/healthPillar'

export interface GoalModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  patientId: string
  planId: string
  pillarId: string
  pillarType: 'Saúde Mental' | 'Biomarcadores de Saúde' | 'Estilo de Vida'
  goal?: GoalEntity | null
  defaultType?: 'Qualidade de Sono' | 'Estresse' | 'Humor' | 'Outros'
  onSuccess?: () => void
}

