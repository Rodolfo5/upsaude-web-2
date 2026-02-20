import { Timestamp } from 'firebase/firestore'

export interface ChatEntity {
  id: string
  patientId: string
  doctorId: string
  createdAt: Timestamp
  blocked: boolean
}
