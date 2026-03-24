import { Timestamp } from 'firebase/firestore'

export type RequestQuestionnairesType = 'MENTAL' | 'BIOMARKERS' | 'LIFESTYLE'

export interface RequestQuestionnairesEntity {
  id: string
  doctorId: string
  patientIds: string[]
  patientsWhoResponded: string[]
  questionnaireName: string
  text?: string
  type: RequestQuestionnairesType
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}
