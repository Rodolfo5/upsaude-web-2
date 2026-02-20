export interface DoctorNotificationEntity {
  id: string
  title: string
  content: string
  users: string[]
  createdAt: Date
  status: string
  hasSeenToUsers: string[]
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
