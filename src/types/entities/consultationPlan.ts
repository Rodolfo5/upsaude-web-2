export interface ConsultationPlanEntity {
  id?: string
  createdAt: Date | string
  updatedAt: Date | string
  specialty: string
  frequency: {
    quantity: number
    interval: 'days' | 'weeks' | 'month'
  }
  totalConsultations: number
  reason: string
  doctorId: string
}

export interface CreateConsultationPlanData {
  userId: string
  therapeuticPlanId: string
  specialty: string
  frequency: {
    quantity: number
    interval: 'days' | 'weeks' | 'month'
  }
  totalConsultations: number
  reason: string
  doctorId: string
  patientId: string
}
