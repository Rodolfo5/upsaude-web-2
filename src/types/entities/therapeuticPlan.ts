export type TherapeuticPlanStatus = 'draft' | 'available'

export type ReevaluationPeriodUnit = 'Meses' | 'Semanas' | 'Dias'

export interface TherapeuticPlanEntity {
  id: string
  patientId: string
  doctorId: string
  objective: string
  reevaluationPeriod: number
  reevaluationPeriodUnit: ReevaluationPeriodUnit
  status: TherapeuticPlanStatus
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string // Nome do médico

  // Campos para tabs futuras
  initialDefinitions?: Record<string, unknown>
  diagnostics?: Record<string, unknown>
  healthPillars?: Record<string, unknown>
  consultationPlan?: Record<string, unknown>
  medications?: Record<string, unknown>

  // Informações adicionais para AI
  aiGeneratedItems?: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  sourceCheckupId?: string // ID do checkup que gerou o plano
  aiGeneratedPlan?: boolean // Se o plano foi gerado pela IA
  aiGeneratedAt?: Date | string
  dischargedAt?: Date | string // Data em que o paciente recebeu alta do plano
}

