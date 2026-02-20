import { Timestamp } from 'firebase/firestore'

export interface ComplementaryConsultationEntity {
  id?: string
  consultationId: string
  doctorId: string
  patientId: string
  specialty: string
  isResponsible: boolean
  frequencyValue: number
  frequencyUnit: 'Semanas' | 'Meses'
  requiredConsultations: number
  doesNotRepeat: boolean
  justification: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
