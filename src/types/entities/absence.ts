import { Timestamp } from 'firebase/firestore'

export interface AbsenceEntity {
  id: string
  doctorId: string
  date: Date
  startHour: string
  endHour: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreateAbsenceData {
  date: Date
  startHour: string
  endHour: string
}
