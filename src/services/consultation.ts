import { startOfDay } from 'date-fns'
import { FirebaseError } from 'firebase/app'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  Timestamp,
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import { ConsultationEntity, SoapData } from '@/types/entities/consultation'

const db = getFirestore(firebaseApp)

const COLLECTION_NAME = 'consultations'

interface PatientIdsResult {
  patientIds: string[]
  error: string | null
}

interface ConsultationsResult {
  consultations: ConsultationEntity[]
  error: string | null
}

export const getUniquePatientIdsByDoctor = async (
  doctorId: string,
): Promise<PatientIdsResult> => {
  if (!doctorId) {
    return {
      patientIds: [],
      error: 'DoctorId Ã© obrigatÃ³rio',
    }
  }

  try {
    const consultationsRef = collection(db, COLLECTION_NAME)

    const q = query(consultationsRef, where('doctorId', '==', doctorId))

    const querySnapshot = await getDocs(q)

    const allPatientIds: string[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data() as ConsultationEntity
      if (data.patientId) {
        allPatientIds.push(data.patientId)
      }
    })

    const uniquePatientIds = Array.from(new Set(allPatientIds))

    return {
      patientIds: uniquePatientIds,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao buscar patientIds:', error)

    if (error instanceof FirebaseError) {
      return {
        patientIds: [],
        error: error.message,
      }
    }

    return {
      patientIds: [],
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao buscar IDs de pacientes',
    }
  }
}

export const getAllConsultations = async (): Promise<ConsultationsResult> => {
  try {
    const consultationsRef = collection(db, COLLECTION_NAME)

    const q = query(consultationsRef, orderBy('createdAt', 'desc'), limit(2000))

    const querySnapshot = await getDocs(q)

    const consultations: ConsultationEntity[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Converter date para Date se for Timestamp
      let consultationDate: Date
      if (data.date?.toDate) {
        consultationDate = data.date.toDate()
      } else if (data.date instanceof Date) {
        consultationDate = data.date
      } else if (data.date) {
        consultationDate = new Date(data.date)
      } else {
        consultationDate = new Date() // Fallback para data atual
      }

      consultations.push({
        id: doc.id,
        doctorId: data.doctorId || '',
        patientId: data.patientId || '',
        date: consultationDate,
        hour: data.hour || '',
        status: data.status || '',
        format: data.format || '',
        value: data.value || '',
        protocolNumber: data.protocolNumber || '',
        consultationId: data.consultationId || undefined,
        soap: data.soap || undefined,
        audioUrl: data.audioUrl || undefined,
        audioTranscription: data.audioTranscription || undefined,
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: data.updatedAt || Timestamp.now(),
        aiSummary: data.aiSummary || undefined,
        aiSummaryUpdatedAt: data.aiSummaryUpdatedAt?.toDate
          ? data.aiSummaryUpdatedAt.toDate()
          : undefined,
        aiSummaryModel: data.aiSummaryModel || undefined,
        startedAt: data.startedAt?.toDate
          ? data.startedAt.toDate()
          : data.startedAt instanceof Date
            ? data.startedAt
            : undefined,
        endedAt: data.endedAt?.toDate
          ? data.endedAt.toDate()
          : data.endedAt instanceof Date
            ? data.endedAt
            : undefined,
      })
    })

    return {
      consultations,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao buscar consultas:', error)

    if (error instanceof FirebaseError) {
      return {
        consultations: [],
        error: error.message,
      }
    }

    return {
      consultations: [],
      error:
        error instanceof Error ? error.message : 'Erro ao buscar consultas',
    }
  }
}

export const getAllConsultationsByDoctor = async (
  doctorId: string,
): Promise<ConsultationsResult> => {
  if (!doctorId) return { consultations: [], error: null }
  try {
    const consultationsRef = collection(db, COLLECTION_NAME)
    const q = query(
      consultationsRef,
      where('doctorId', '==', doctorId),
      orderBy('createdAt', 'desc'),
      limit(1000),
    )
    const querySnapshot = await getDocs(q)
    const consultations = querySnapshot.docs.map(mapDocToConsultationEntity)
    return { consultations, error: null }
  } catch (error: unknown) {
    if (error instanceof FirebaseError) {
      return { consultations: [], error: error.message }
    }
    return {
      consultations: [],
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao buscar consultas do mÃ©dico',
    }
  }
}

/**
 * Busca consultas de um mÃ©dico a partir de uma data (date-scoped).
 * Usa Ã­ndice composto doctorId + date para evitar busca full-scan.
 * Ideal para dashboard (apenas mÃªs atual ou hoje).
 */
export const getConsultationsByDoctorSince = async (
  doctorId: string,
  since: Date,
): Promise<ConsultationsResult> => {
  if (!doctorId) return { consultations: [], error: null }
  try {
    const consultationsRef = collection(db, COLLECTION_NAME)
    const sinceTimestamp = Timestamp.fromDate(since)
    const q = query(
      consultationsRef,
      where('doctorId', '==', doctorId),
      where('date', '>=', sinceTimestamp),
      orderBy('date', 'desc'),
      limit(500),
    )
    const querySnapshot = await getDocs(q)
    const consultations = querySnapshot.docs.map(mapDocToConsultationEntity)
    return { consultations, error: null }
  } catch (error: unknown) {
    if (error instanceof FirebaseError) {
      return { consultations: [], error: error.message }
    }
    return {
      consultations: [],
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao buscar consultas por perÃ­odo',
    }
  }
}


function mapDocToConsultationEntity(
  docSnapshot: QueryDocumentSnapshot,
): ConsultationEntity {
  const data = docSnapshot.data()
  let consultationDate: Date
  if (data?.date?.toDate) {
    consultationDate = data.date.toDate()
  } else if (data?.date instanceof Date) {
    consultationDate = data.date
  } else if (data?.date) {
    consultationDate = new Date(data.date)
  } else {
    consultationDate = new Date()
  }
  return {
    id: docSnapshot.id,
    doctorId: data?.doctorId || '',
    patientId: data?.patientId || '',
    date: consultationDate,
    hour: data?.hour || '',
    status: data?.status || '',
    format: data?.format || '',
    value: data?.value ?? '',
    protocolNumber: data?.protocolNumber || '',
    consultationId: data?.consultationId || undefined,
    soap: data?.soap || undefined,
    audioUrl: data?.audioUrl || undefined,
    audioTranscription: data?.audioTranscription || undefined,
    createdAt: data?.createdAt || Timestamp.now(),
    updatedAt: data?.updatedAt || Timestamp.now(),
    aiSummary: data?.aiSummary || undefined,
    aiSummaryUpdatedAt: data?.aiSummaryUpdatedAt?.toDate
      ? data.aiSummaryUpdatedAt.toDate()
      : undefined,
    aiSummaryModel: data?.aiSummaryModel || undefined,
    startedAt: data?.startedAt?.toDate
      ? data.startedAt.toDate()
      : data?.startedAt instanceof Date
        ? data.startedAt
        : undefined,
    endedAt: data?.endedAt?.toDate
      ? data.endedAt.toDate()
      : data?.endedAt instanceof Date
        ? data.endedAt
        : undefined,
  }
}

/**
 * Inscreve em tempo real nas consultas de um mÃ©dico em uma data (inÃ­cio do dia).
 * Busca por doctorId e filtra no cliente pelo dia, para ser consistente com
 * a forma como a data Ã© armazenada (Timestamp ou outro formato).
 * Retorna funÃ§Ã£o para cancelar a inscriÃ§Ã£o.
 */
export function subscribeToDoctorConsultationsByDate(
  doctorId: string,
  date: Date,
  onUpdate: (consultations: ConsultationEntity[]) => void,
): () => void {
  if (!doctorId) return () => {}
  const consultationsRef = collection(db, COLLECTION_NAME)
  const targetDayStart = startOfDay(date).getTime()
  const q = query(consultationsRef, where('doctorId', '==', doctorId))
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => mapDocToConsultationEntity(d))
      const onSameDay = list.filter((c) => {
        const d = c.date instanceof Date ? c.date : new Date(c.date)
        return startOfDay(d).getTime() === targetDayStart
      })
      onUpdate(onSameDay)
    },
    (err) => {
      console.error('subscribeToDoctorConsultationsByDate error:', err)
      onUpdate([])
    },
  )
  return unsubscribe
}

export interface AverageConsultationDurationResult {
  averageMinutes: number | null
  totalCount: number
  error: string | null
}

function toDate(value: Timestamp | Date | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof (value as Timestamp).toDate === 'function')
    return (value as Timestamp).toDate()
  return null
}

/**
 * Calcula o tempo mÃ©dio de consultas concluÃ­das.
 * - Presenciais: usa startedAt e endedAt do documento da consulta.
 * - Online: usa createdAt e endedAt do documento na subcollection videoCalls.
 * Apenas consultas com status COMPLETED sÃ£o consideradas.
 */
export const getAverageConsultationDuration =
  async (): Promise<AverageConsultationDurationResult> => {
    try {
      const consultationsRef = collection(db, COLLECTION_NAME)
      const q = query(consultationsRef, where('status', '==', 'COMPLETED'))
      const snapshot = await getDocs(q)

      const isPresential = (format: string) => {
        const f = (format || '').toUpperCase()
        return f === 'PRESENTIAL' || f === 'PRESENCIAL' || f === 'IN_PERSON'
      }
      const isOnline = (format: string) =>
        (format || '').toUpperCase() === 'ONLINE'

      let totalMs = 0
      let count = 0

      for (const consultationDoc of snapshot.docs) {
        const data = consultationDoc.data()
        const format = data.format || ''
        const id = consultationDoc.id

        if (isPresential(format)) {
          const startedAt = toDate(data.startedAt)
          const endedAt = toDate(data.endedAt)
          if (startedAt && endedAt) {
            totalMs += endedAt.getTime() - startedAt.getTime()
            count += 1
          }
          continue
        }

        if (isOnline(format)) {
          const videoCallsRef = collection(
            db,
            COLLECTION_NAME,
            id,
            'videoCalls',
          )
          const videoSnapshot = await getDocs(videoCallsRef)
          for (const callDoc of videoSnapshot.docs) {
            const callData = callDoc.data()
            const createdAt = toDate(callData.createdAt)
            const endedAt = toDate(callData.endedAt)
            if (createdAt && endedAt) {
              totalMs += endedAt.getTime() - createdAt.getTime()
              count += 1
              break
            }
          }
        }
      }

      const averageMinutes = count > 0 ? totalMs / count / 60_000 : null

      return {
        averageMinutes,
        totalCount: count,
        error: null,
      }
    } catch (error: unknown) {
      console.error('Erro ao calcular tempo mÃ©dio de consultas:', error)
      const errorMessage =
        error instanceof FirebaseError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Erro ao calcular tempo mÃ©dio'
      return {
        averageMinutes: null,
        totalCount: 0,
        error: errorMessage,
      }
    }
  }

export interface AverageOnlineWaitingResult {
  averageWaitingMinutes: number | null
  totalCount: number
  error: string | null
}

/**
 * Converte date + hour ("21:30") em Date no mesmo dia.
 */
function parseScheduledAt(
  consultationDate: Date,
  hourStr: string,
): Date | null {
  const base = new Date(consultationDate)
  base.setHours(0, 0, 0, 0)
  if (!hourStr || typeof hourStr !== 'string') return null
  const [h = '0', m = '0'] = hourStr
    .trim()
    .split(':')
    .map((s) => s.trim())
  const hours = Number.parseInt(h, 10)
  const minutes = Number.parseInt(m, 10)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  base.setHours(hours, minutes, 0, 0)
  return base
}

/**
 * Tempo mÃ©dio de espera para entrar em consulta online (sÃ³ COMPLETED).
 * Compara o horÃ¡rio agendado (date + hour) com o createdAt da videochamada.
 * Se comeÃ§ou antes do agendado = 0 min de espera; se depois = diferenÃ§a em minutos.
 */
export const getAverageOnlineWaitingTime =
  async (): Promise<AverageOnlineWaitingResult> => {
    try {
      const consultationsRef = collection(db, COLLECTION_NAME)
      const q = query(consultationsRef, where('status', '==', 'COMPLETED'))
      const snapshot = await getDocs(q)

      const isOnline = (format: string) =>
        (format || '').toUpperCase() === 'ONLINE'

      let totalWaitingMs = 0
      let count = 0

      for (const consultationDoc of snapshot.docs) {
        const data = consultationDoc.data()
        if (!isOnline(data.format || '')) continue
        const id = consultationDoc.id
        const consultationDate = toDate(data.date)
        const hourStr = data.hour
        if (!consultationDate || !hourStr) continue

        const scheduledAt = parseScheduledAt(consultationDate, hourStr)
        if (!scheduledAt) continue

        const videoCallsRef = collection(db, COLLECTION_NAME, id, 'videoCalls')
        const videoSnapshot = await getDocs(videoCallsRef)
        for (const callDoc of videoSnapshot.docs) {
          const callData = callDoc.data()
          const actualStart = toDate(callData.createdAt)
          const endedAt = toDate(callData.endedAt)
          if (!actualStart || !endedAt) continue
          const delayMs = Math.max(
            0,
            actualStart.getTime() - scheduledAt.getTime(),
          )
          totalWaitingMs += delayMs
          count += 1
          break
        }
      }

      const averageWaitingMinutes =
        count > 0 ? totalWaitingMs / count / 60_000 : null

      return {
        averageWaitingMinutes,
        totalCount: count,
        error: null,
      }
    } catch (error: unknown) {
      console.error('Erro ao calcular tempo mÃ©dio de espera online:', error)
      const errorMessage =
        error instanceof FirebaseError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Erro ao calcular tempo mÃ©dio de espera'
      return {
        averageWaitingMinutes: null,
        totalCount: 0,
        error: errorMessage,
      }
    }
  }

export const getConsultationsByPatientId = async (
  patientId: string,
): Promise<ConsultationsResult> => {
  if (!patientId) {
    return {
      consultations: [],
      error: 'PatientId Ã© obrigatÃ³rio',
    }
  }

  try {
    const consultationsRef = collection(db, COLLECTION_NAME)

    const q = query(
      consultationsRef,
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc'),
    )

    const querySnapshot = await getDocs(q)

    const consultations: ConsultationEntity[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      consultations.push({
        id: doc.id,
        doctorId: data.doctorId || '',
        patientId: data.patientId || '',
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        hour: data.hour || '',
        status: data.status || '',
        format: data.format || '',
        value: data.value || '',
        protocolNumber: data.protocolNumber || '',
        consultationId: data.consultationId || undefined,
        soap: data.soap || undefined,
        audioUrl: data.audioUrl || undefined,
        audioTranscription: data.audioTranscription || undefined,
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: data.updatedAt || Timestamp.now(),
        planId: data.planId || undefined,
        startedAt: data.startedAt?.toDate
          ? data.startedAt.toDate()
          : data.startedAt instanceof Date
            ? data.startedAt
            : undefined,
        endedAt: data.endedAt?.toDate
          ? data.endedAt.toDate()
          : data.endedAt instanceof Date
            ? data.endedAt
            : undefined,
      })
    })

    return {
      consultations,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao buscar consultas por patientId:', error)

    if (error instanceof FirebaseError) {
      return {
        consultations: [],
        error: error.message,
      }
    }

    return {
      consultations: [],
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao buscar consultas do paciente',
    }
  }
}

interface SoapResult {
  data: SoapData | null
  error: string | null
}

export const getConsultationSoap = async (
  consultationId: string,
): Promise<SoapResult> => {
  try {
    if (!consultationId) {
      return { data: null, error: 'ID da consulta é obrigatório' }
    }

    const consultationRef = doc(db, COLLECTION_NAME, consultationId)
    const consultationSnap = await getDoc(consultationRef)

    if (!consultationSnap.exists()) {
      return { data: null, error: 'Consulta não encontrada' }
    }

    const soap = consultationSnap.data()?.soap as SoapData | undefined

    return {
      data: {
        subjective: soap?.subjective || '',
        objective: soap?.objective || '',
        assessment: soap?.assessment || '',
        plan: soap?.plan || '',
      },
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof FirebaseError
          ? error.message
          : 'Erro ao buscar dados SOAP',
    }
  }
}

export const getConsultationsByPlanId = async (
  planId: string,
): Promise<ConsultationsResult> => {
  if (!planId) {
    return {
      consultations: [],
      error: 'PlanId é obrigatório',
    }
  }

  try {
    const consultationsRef = collection(db, COLLECTION_NAME)

    const q = query(
      consultationsRef,
      where('planId', '==', planId),
      orderBy('createdAt', 'desc'),
    )

    const querySnapshot = await getDocs(q)

    const consultations: ConsultationEntity[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      consultations.push({
        id: doc.id,
        doctorId: data.doctorId || '',
        patientId: data.patientId || '',
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        hour: data.hour || '',
        status: data.status || '',
        format: data.format || '',
        value: data.value || '',
        protocolNumber: data.protocolNumber || '',
        planId: data.planId || undefined,
        soap: data.soap || undefined,
        audioUrl: data.audioUrl || undefined,
        audioTranscription: data.audioTranscription || undefined,
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: data.updatedAt || Timestamp.now(),
        startedAt: data.startedAt?.toDate
          ? data.startedAt.toDate()
          : data.startedAt instanceof Date
            ? data.startedAt
            : undefined,
        endedAt: data.endedAt?.toDate
          ? data.endedAt.toDate()
          : data.endedAt instanceof Date
            ? data.endedAt
            : undefined,
      })
    })

    return {
      consultations,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao buscar consultas do plano:', error)

    if (error instanceof FirebaseError) {
      return {
        consultations: [],
        error: error.message,
      }
    }

    return {
      consultations: [],
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao buscar consultas do plano',
    }
  }
}
