import { Timestamp } from 'firebase/firestore'

export interface RequestConsultationsEntity {
  id: string
  consultationId: string
  doctorId: string
  patientId: string
  speciality: string
  responsible: boolean
  frequency?: string
  frequencyType?: string
  numberConsultations?: string
  reason: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
