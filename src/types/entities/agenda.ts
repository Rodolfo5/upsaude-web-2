export interface ShiftData {
  startTime?: string
  endTime?: string
  consultationTypes?: string[]
  format?: string[]
  value?: number
  isPromotional?: boolean
}

export interface AgendaEntity {
  professionalId: string
  complementaryConsultationDuration?: number
  hasCompletedOnboarding?: boolean
  selectedDays?: string[]
  shifts?: Record<string, ShiftData[]>
  currentStep?: number
}
