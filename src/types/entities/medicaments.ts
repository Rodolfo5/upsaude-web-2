import { Timestamp } from 'firebase/firestore'

export enum MedicationStatus {
  CREATED = 'CREATED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  SUSPENDED = 'SUSPENDED',
}

export enum MedicationCreationBy {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
}

export interface MedicationEntity {
  id: string
  userId: string
  name: string
  image: string
  usageClassification: string
  pharmaceuticalForm: string
  observation?: string
  concentration: number
  concentrationUnit: string
  stock: number
  stockUnit: string
  dose: number
  doseUnit: string
  interval?: number
  intervalUnit?: string
  startDate?: Timestamp
  endDate?: Timestamp
  prescriber?: string
  otherPrescriber?: string
  attachment?: string
  prescriptionDate?: string
  medicationReminder?: {
    id: string
    time: number
    timeUnit: string
  }[]
  inventoryReminder?: {
    id: string
    time: number
  }[]
  status: MedicationStatus
  createdBy: MedicationCreationBy
  methodOfMeasurement?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
