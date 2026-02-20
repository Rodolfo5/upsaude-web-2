import { ConsultationEntity } from './consultation'

export interface AgendaConsultation extends ConsultationEntity {
  patientName: string
  startDateTime: Date
  endDateTime: Date
}

export interface AgendaAbsence {
  id: string
  type: 'absence'
  doctorId: string
  date: Date
  startDateTime: Date
  endDateTime: Date
  startHour: string
  endHour: string
}

export type AgendaItem = AgendaConsultation | AgendaAbsence

export function isAbsence(item: AgendaItem): item is AgendaAbsence {
  return 'type' in item && item.type === 'absence'
}

export function isConsultation(item: AgendaItem): item is AgendaConsultation {
  return !isAbsence(item)
}
