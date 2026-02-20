export type HealthPillarType =
  | 'Saúde Mental'
  | 'Biomarcadores de Saúde'
  | 'Estilo de Vida'

export type MentalHealthGoalType =
  | 'Qualidade de Sono'
  | 'Estresse'
  | 'Humor'
  | 'Outros'

export type GoalStatus = 'Ativa' | 'Atingida' | 'Desativada'

export type ActivityStatus = 'Ativa' | 'Desativada' | 'Realizada'

export type OrientationStatus = 'Ativa' | 'Desativada'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface TrainingPrescriptionEntity {
  id: string
  activityId: string
  title: string
  description: string
  order?: number
  doctorId: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface HealthPillarEntity {
  id: string
  patientId: string
  planId: string
  type: HealthPillarType
  createdAt: Date | string
  updatedAt: Date | string
}

export interface GoalEntity {
  id: string
  pillarId: string
  type?: MentalHealthGoalType
  name?: string
  customTitle?: string
  status: GoalStatus
  desiredParameter?: string
  doctorId: string
  createdAt: Date | string
  updatedAt: Date | string
  aiGenerated?: boolean
  aiGeneratedAt?: Date | string
  aiModel?: string
  approvalStatus?: ApprovalStatus
}

export interface ActivityEntity {
  id: string
  pillarId: string
  goalId: string
  name: string
  description?: string
  frequency?: string
  endDate?: Date | string
  status: ActivityStatus
  doctorId: string
  createdAt: Date | string
  updatedAt: Date | string
  // Campos específicos para recomendações de exercício
  modality?: string | string[] // Pode ser string única ou array para múltiplas seleções
  category?: string | string[] // Pode ser string única ou array para múltiplas seleções
  intensity?: string
  frequencyValue?: string
  frequencyUnit?: string
  patientGuidelines?: string
  distanceKm?: number // Distância em km para caminhada e corrida
  // Campos específicos para atividades de biomarcadores
  deadlineValue?: string // Valor do prazo (ex: "1")
  deadlineUnit?: string // Unidade do prazo (ex: "Mês")
  // Prescrições de treino (salvas como array na atividade)
  trainingPrescriptions?: TrainingPrescriptionEntity[]
  // Campos de IA
  aiGenerated?: boolean
  aiGeneratedAt?: Date | string
  aiModel?: string
  approvalStatus?: ApprovalStatus
}

export interface FoodItem {
  id: string
  name: string
  portion: number
  portionUnit: 'g' | 'ml'
  kcal: string
}

export interface MealEntry {
  id: string
  dayOfWeek: string
  mealType: string
  foods: FoodItem[]
}

export interface MenuData {
  meals: MealEntry[]
}

export interface MenuEntity {
  id: string
  pillarId: string
  title: string
  description?: string
  status: OrientationStatus
  doctorId: string
  createdAt: Date | string
  updatedAt: Date | string
  menuData?: MenuData
  tags?: string[]
}

export interface OrientationEntity {
  id: string
  pillarId: string
  goalId: string
  area?: string
  title: string
  description?: string
  supportMaterial?: string
  isRead: boolean
  status: OrientationStatus
  doctorId: string
  createdAt: Date | string
  updatedAt: Date | string
  aiGenerated?: boolean
  aiGeneratedAt?: Date | string
  aiModel?: string
  approvalStatus?: ApprovalStatus
  // Campos específicos para cardápio
  menuData?: MenuData
  tags?: string[]
}

export type LifestyleCategoryType =
  | 'Hidratação'
  | 'Peso'
  | 'Movimentos - Passos'
  | 'Movimentos - Gasto Calórico'
  | 'Alimentação'

export interface LifestyleCategoryEntity {
  id: string
  pillarId: string
  type: LifestyleCategoryType
  status: GoalStatus
  desiredParameter?: number | string | object // number para valores simples, string para compatibilidade, object para peso/passos
  doctorId: string
  createdAt: Date | string
  updatedAt: Date | string
  aiGenerated?: boolean
  aiGeneratedAt?: Date | string
  aiModel?: string
  approvalStatus?: ApprovalStatus
}

export type TrackStatus = 'Finalizado' | 'Em progresso' | 'Não iniciado'

export interface TrackEntity {
  id: string
  pillarId: string
  goalId: string
  name: string
  description?: string
  observations?: string
  status?: TrackStatus
  doctorId: string
  createdAt: Date | string
  updatedAt: Date | string
}

export type ExerciseType =
  | 'Cartas de gratidão'
  | 'Exercícios de respiração'
  | 'Meditação guiada'
  | 'Microreflexões'
  | 'Exercícios de autoestima'
  | 'Autoreflexões de melhorias'
  | 'Exercício extra'

export interface ExerciseAnswer {
  question: string
  answer: string
}

export interface ExerciseEntity {
  id: string
  trackId: string
  type: ExerciseType
  name: string
  description?: string
  order?: number
  isCompleted?: boolean
  answers?: ExerciseAnswer[]
  doctorId: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface SleepTimeEntity {
  id: string // formato dd-mm-aaaa-hh-mm-ss
  goalId: string
  sleepTime: string // formato "hh:mm"
  createdAt: Date | string
}

export interface HumorEntity {
  id: string // formato dd-mm-aaaa-hh-mm-ss
  goalId: string
  humor: string // "alto" | "intermediário" | "baixo"
  createdAt: Date | string
}

export interface ActivityCompletionEntity {
  id: string // formato dd-mm-aaaa-hh-mm-ss
  activityId: string
  isCompleted: boolean
  createdAt: Date | string
}
