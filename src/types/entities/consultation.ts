import { Timestamp } from 'firebase/firestore'

export interface SoapData {
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
}

export interface ConsultationEntity {
  id: string
  doctorId: string
  patientId: string
  date: Date
  hour: string
  status: string
  format: string
  value: string | number
  protocolNumber: string
  consultationId?: string // Link to plan or therapeutic plan
  soap?: SoapData
  audioUrl?: string
  audioTranscription?: string
  aiSummary?: string
  aiSummaryUpdatedAt?: Date | Timestamp
  aiSummaryModel?: string
  checkedInAt?: Date | Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
  planId?: string
  endedAt?: Date | Timestamp
  startedAt?: Date | Timestamp
}
