import { FirebaseError } from 'firebase/app'
import { addDoc, collection, getFirestore, Timestamp } from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'

const db = getFirestore(firebaseApp)

const COLLECTION_NAME = 'requestConsultations'

interface RequestConsultationResult {
  requestId: string | null
  error: string | null
}

export interface CreateRequestConsultationData {
  consultationId?: string
  doctorId: string
  patientId: string
  specialty: string
  responsible: boolean
  numberConsultations?: string
  reason: string
  type?: 'SEPARATE' | 'PLAN'
}

export const createRequestConsultation = async (
  data: CreateRequestConsultationData,
): Promise<RequestConsultationResult> => {
  if (!data.doctorId) {
    return {
      requestId: null,
      error: 'DoctorId é obrigatório',
    }
  }

  if (!data.patientId) {
    return {
      requestId: null,
      error: 'PatientId é obrigatório',
    }
  }

  if (!data.specialty) {
    return {
      requestId: null,
      error: 'Especialidade é obrigatória',
    }
  }

  if (!data.reason) {
    return {
      requestId: null,
      error: 'Motivo é obrigatório',
    }
  }

  try {
    const requestConsultationsRef = collection(db, COLLECTION_NAME)

    const now = Timestamp.now()

    const requestData: Record<string, unknown> = {
      doctorId: data.doctorId,
      patientId: data.patientId,
      specialty: data.specialty,
      responsible: data.responsible,
      numberConsultations: data.numberConsultations ?? '',
      reason: data.reason,
      createdAt: now,
      updatedAt: now,
      type: data.type ?? 'SEPARATE',
    }
    if (
      data.numberConsultations !== undefined &&
      data.numberConsultations !== ''
    ) {
      requestData.numberConsultations = data.numberConsultations
    }
    if (data.consultationId) {
      requestData.consultationId = data.consultationId
    }

    const newRequestRef = await addDoc(requestConsultationsRef, requestData)

    return {
      requestId: newRequestRef.id,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao criar solicitação de consulta complementar:', error)

    if (error instanceof FirebaseError) {
      return {
        requestId: null,
        error: error.message,
      }
    }

    return {
      requestId: null,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao criar solicitação de consulta complementar',
    }
  }
}
