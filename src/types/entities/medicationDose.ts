import { Timestamp } from 'firebase/firestore'

export interface MedicationDoseEntity {
  id: string // Formato: dd-mm-aaaa-hh-mm-ss
  medicationId: string
  userId: string
  scheduledTime: Timestamp // Horário programado original
  status: DoseStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

export enum DoseStatus {
  TAKEN = 'tomei', // Tomei
  IGNORED = 'ignorei', // Ignorei
  DELAYED = 'adiei', // Adiei
}
