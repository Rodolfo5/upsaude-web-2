import { AgendaEntity } from "./agenda"

export enum UserRole {
  ADMIN = 'ADMIN',
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export interface OfficeEntity {
  cep?: string
  city?: string
  state?: string
  neighborhood?: string
  complement?: string
  address?: string
}

export interface UserEntity {
  id: string
  uid?: string
  name: string
  email: string
  cpf?: string
  birthDate?: Date
  profileImage?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  status?: UserStatus
  isCompleted?: boolean
  currentStep?: number
  agenda?: AgendaEntity
}

export interface PatientEntity extends UserEntity {
  steps: string
  phoneNumber: string
  weight: string
  height: string
  socialName: string
  sex?: string
  gender: string
  bloodType: string
  cep: string
  address: string
  number: string
  complement: string
  neighborhood: string
  isDependent: boolean
  accountHolder?: string
  dependents?: string[]
  city: string
  state: string
  initialConsultation: boolean
  doctorId?: string
  riskClassification?: string
  justificationChangeRiskClassification?: string
  planReassessment?: boolean
  score?: number
  tokens?: string[]
}

export interface DoctorEntity extends UserEntity {
  state?: string
  typeOfCredential?: string
  credential?: string
  specialty?: string
  credentialDocument?: string
  office?: OfficeEntity
  steps?: string
  patientsId?: string[]
  questionnaires?: string[]
  appointmentsId?: string[]
  exams?: string[]
  memedId?: string
  memedRegistered?: boolean
  token?: string
  // QR Code registration fields
  fromQRCode?: boolean
  qrCodePatientId?: string
}