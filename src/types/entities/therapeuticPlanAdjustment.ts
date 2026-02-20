export interface TherapeuticPlanAdjustmentEntity {
  id: string
  patientId: string
  planId: string
  adjustmentType: string // ex: "Meta de saúde mental", "Recomendação nutricional", etc
  title: string // ex: "Meta de saúde mental ajustada"
  doctorId: string
  doctorName: string
  createdAt: Date | string
}
