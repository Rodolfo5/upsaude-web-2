import { Timestamp } from 'firebase/firestore'

export enum DoseStatus {
  TAKEN = 'tomei',
  IGNORED = 'ignorei',
  DELAYED = 'adiei',
}

export interface MedicationDoseEntity {
  id: string // Formato: dd-mm-aaaa-hh-mm-ss
  medicationId: string
  userId: string
  scheduledTime: Timestamp // Horário programado original
  status: DoseStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}
