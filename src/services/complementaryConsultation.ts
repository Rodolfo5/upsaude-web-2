import { FirebaseError } from 'firebase/app'
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  Timestamp,
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import { ComplementaryConsultationEntity } from '@/types/entities/complementaryConsultation'

const db = getFirestore(firebaseApp)

const COLLECTION_NAME = 'complementaryConsultations'

interface OperationResult {
  success: boolean
  error: string | null
}

interface ComplementaryConsultationsResult {
  complementaryConsultations: ComplementaryConsultationEntity[]
  error: string | null
}

export const createComplementaryConsultation = async (
  data: Omit<ComplementaryConsultationEntity, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<OperationResult> => {
  if (!data.consultationId) {
    return {
      success: false,
      error: 'ID da consulta é obrigatório',
    }
  }

  if (!data.doctorId) {
    return {
      success: false,
      error: 'ID do médico é obrigatório',
    }
  }

  if (!data.patientId) {
    return {
      success: false,
      error: 'ID do paciente é obrigatório',
    }
  }

  try {
    const consultationsRef = collection(db, COLLECTION_NAME)
    const now = Timestamp.now()

    await addDoc(consultationsRef, {
      ...data,
      createdAt: now,
      updatedAt: now,
    })

    return {
      success: true,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao criar consulta complementar:', error)

    if (error instanceof FirebaseError) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao criar consulta complementar',
    }
  }
}

export const getComplementaryConsultationsByDoctor = async (
  doctorId: string,
): Promise<ComplementaryConsultationsResult> => {
  if (!doctorId) {
    return {
      complementaryConsultations: [],
      error: 'DoctorId é obrigatório',
    }
  }

  try {
    const consultationsRef = collection(db, COLLECTION_NAME)
    const q = query(consultationsRef, where('doctorId', '==', doctorId))
    const querySnapshot = await getDocs(q)

    const complementaryConsultations: ComplementaryConsultationEntity[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      complementaryConsultations.push({
        id: doc.id,
        consultationId: data.consultationId || '',
        doctorId: data.doctorId || '',
        patientId: data.patientId || '',
        specialty: data.specialty || '',
        isResponsible: data.isResponsible || false,
        frequencyValue: data.frequencyValue || 0,
        frequencyUnit: data.frequencyUnit || 'Semanas',
        requiredConsultations: data.requiredConsultations || 0,
        doesNotRepeat: data.doesNotRepeat || false,
        justification: data.justification || '',
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: data.updatedAt || Timestamp.now(),
      })
    })

    return {
      complementaryConsultations,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao buscar consultas complementares:', error)

    if (error instanceof FirebaseError) {
      return {
        complementaryConsultations: [],
        error: error.message,
      }
    }

    return {
      complementaryConsultations: [],
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao buscar consultas complementares',
    }
  }
}
