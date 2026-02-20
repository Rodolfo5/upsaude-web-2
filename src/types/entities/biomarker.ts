export type BiomarkerType =
  | 'bloodGlucose'
  | 'bloodPressure'
  | 'heartRate'
  | 'oximetry'
  | 'temperature'

export type BiomarkerStatus = 'pending' | 'approved' | 'rejected'

export interface BiomarkerEntity {
  id: string
  pillarId: string
  type: BiomarkerType
  minValue: string
  maxValue: string
  status: BiomarkerStatus
  createdBy: string // "IA" ou nome do médico
  editedBy?: string // Nome do médico quando editado
  createdAt: Date | string
  updatedAt: Date | string
}
