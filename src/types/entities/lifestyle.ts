export interface ExerciseRecordEntity {
  id: string // formato dd-mm-aaaa-hh-mm-ss
  activityId: string
  categoryId: string
  caloriesBurned: number
  duration: string // formato "30:00" (minutos:segundos)
  createdAt: Date | string
}

export interface WeightRecordEntity {
  id: string // formato dd-mm-aaaa-hh-mm-ss
  activityId: string
  weight: number
  imageUrl?: string
  createdAt: Date | string
}

export interface LifestyleCategory {
  id: string
  type: string
  desiredParameter?: {
    currentWeight?: number
    deadline?: number
    deadlineUnit?: string
    objective?: 'Perder' | 'Ganhar' | 'Manter'
    patientGuidelines?: string
    quantity?: number
  }
}
