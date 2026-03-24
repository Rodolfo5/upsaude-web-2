import { FirebaseError } from 'firebase/app'
import {
  doc,
  addDoc,
  collection,
  getFirestore,
  Timestamp,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import { timestampToDate } from '@/lib/utils'
import type {
  RequestQuestionnairesEntity,
  RequestQuestionnairesType,
} from '@/types/entities/requestQuestionnaires'

const db = getFirestore(firebaseApp)

const COLLECTION_NAME = 'requestQuestionnaires'

interface RequestQuestionnaireResult {
  requestId: string | null
  error: string | null
}

export interface CreateRequestQuestionnaireData {
  doctorId: string
  patientIds: string[]
  questionnaireName: string
  text?: string
  type: RequestQuestionnairesType
}

export const createRequestQuestionnaire = async (
  data: CreateRequestQuestionnaireData,
): Promise<RequestQuestionnaireResult> => {
  if (!data.doctorId) {
    return {
      requestId: null,
      error: 'DoctorId é obrigatório',
    }
  }

  if (!data.patientIds || data.patientIds.length === 0) {
    return {
      requestId: null,
      error: 'É necessário selecionar pelo menos um paciente',
    }
  }

  if (!data.questionnaireName) {
    return {
      requestId: null,
      error: 'Nome do questionário é obrigatório',
    }
  }

  try {
    const requestQuestionnairesRef = collection(db, COLLECTION_NAME)

    const now = Timestamp.now()

    const newRequestRef = await addDoc(requestQuestionnairesRef, {
      doctorId: data.doctorId,
      patientIds: data.patientIds,
      patientsWhoResponded: [],
      questionnaireName: data.questionnaireName,
      text: data.text || '',
      type: data.type,
      createdAt: now,
      updatedAt: now,
    })

    return {
      requestId: newRequestRef.id,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao criar solicitação de questionário:', error)

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
          : 'Erro ao criar solicitação de questionário',
    }
  }
}

/**
 * Busca um RequestQuestionnaire específico por ID
 */
export async function findRequestQuestionnaireById(
  requestQuestionnaireId: string,
): Promise<RequestQuestionnairesEntity | null> {
  try {
    const docRef = doc(db, 'requestQuestionnaires', requestQuestionnaireId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) return null

    const data = docSnap.data() as Omit<RequestQuestionnairesEntity, 'id'>
    return {
      id: docSnap.id,
      ...data,
      createdAt: timestampToDate(data.createdAt) ?? new Date(),
      updatedAt: timestampToDate(data.updatedAt) ?? new Date(),
    } as RequestQuestionnairesEntity
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[findRequestQuestionnaireById] error', error)
    throw error
  }
}

export async function findAllRequestQuestionnairesForPatient(
  patientId: string,
): Promise<RequestQuestionnairesEntity[]> {
  const coll = collection(db, 'requestQuestionnaires')
  try {
    const q = query(
      coll,
      where('patientIds', 'array-contains', patientId),
      orderBy('createdAt', 'desc'),
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) return []

    return snapshot.docs.map((docItem) => {
      const data = docItem.data() as Omit<RequestQuestionnairesEntity, 'id'>
      return {
        id: docItem.id,
        ...data,
        createdAt: timestampToDate(data.createdAt) ?? new Date(),
        updatedAt: timestampToDate(data.updatedAt) ?? new Date(),
      } as RequestQuestionnairesEntity
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[findAllRequestQuestionnairesForPatient] error', error)
    throw error
  }
}
