import { Timestamp } from 'firebase/firestore'

export interface TimelinePatientEntity {
  id: string
  patientId: string
  createdAt: Timestamp
  title: string
  createdBy: 'Doctor' | 'Patient' | 'System'
  type:
    | 'Questionários de Saúde'
    | 'Exames'
    | 'Prescrição Memed'
    | 'Medicamento'
    | 'Consulta'
    | 'Trilhas de Saúde'
    | 'Check-Up digital'
    | 'Plano Terapêutico'
    | 'Observações Médicas'
    | 'SOAP'
    | 'Outros'
}
