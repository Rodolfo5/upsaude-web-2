export type DiagnosticCategory = 'Agudo' | 'Crônico' | 'Recorrente' | 'Suspeita'

export type DiagnosticStatus =
  | 'Ativo'
  | 'Resolvido'
  | 'Descartado'
  | 'Em remissão'

export interface DiagnosticEntity {
  id: string
  name: string
  cid: string
  category: DiagnosticCategory
  status: DiagnosticStatus
  registeredBy: string
  doctorId: string
  registeredAt: Date | string
  createdAt: Date | string
  updatedAt: Date | string
}
