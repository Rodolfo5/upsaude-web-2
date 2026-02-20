export interface NotificationEntity {
  id: string
  title: string
  content: string
  users: {
    userId: string
    tokens: string[]
  }[]
  createdAt: Date
  date: Date | null
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
  status: string
  hasSeenToUsers: string[]
}
