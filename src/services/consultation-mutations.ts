import { FirebaseError } from 'firebase/app'
import {
  collection,
  doc,
  FieldValue,
  getDoc,
  getFirestore,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import logger from '@/lib/logger'
import { notifyConsultationCanceled } from '@/services/emailNotification'
import { SoapData } from '@/types/entities/consultation'

const db = getFirestore(firebaseApp)

const COLLECTION_NAME = 'consultations'

interface UpdateConsultationData {
  date?: Date
  hour?: string
  status?: string
  format?: string
  patientAuthorized?: boolean
  value?: string | number
  soap?: SoapData
  audioUrl?: string
  audioTranscription?: string
  aiSummary?: string
  aiSummaryUpdatedAt?: Date
  aiSummaryModel?: string
  startedAt?: Date
  endedAt?: Date
}

interface OperationResult {
  success: boolean
  error: string | null
}

interface UpdateSoapResult {
  success: boolean
  error: string | null
}

export const updateConsultation = async (
  consultationId: string,
  updates: UpdateConsultationData,
): Promise<OperationResult> => {
  if (!consultationId) {
    return {
      success: false,
      error: 'ID da consulta é obrigatório',
    }
  }

  try {
    const consultationRef = doc(db, COLLECTION_NAME, consultationId)

    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    }

    if (updates.date !== undefined) {
      updateData.date = Timestamp.fromDate(updates.date)
    }
    if (updates.hour !== undefined) {
      updateData.hour = updates.hour
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status
    }
    if (updates.format !== undefined) {
      updateData.format = updates.format
    }
    if (updates.value !== undefined) {
      updateData.value = updates.value
    }
    if (updates.soap !== undefined) {
      updateData.soap = updates.soap
    }
    if (
      updates.audioUrl !== undefined &&
      updates.audioUrl !== null &&
      updates.audioUrl !== ''
    ) {
      updateData.audioUrl = updates.audioUrl
      logger.log('Salvando audioUrl no Firestore:', updates.audioUrl)
    } else {
      logger.log('audioUrl não será salvo:', {
        audioUrl: updates.audioUrl,
        isUndefined: updates.audioUrl === undefined,
        isNull: updates.audioUrl === null,
        isEmpty: updates.audioUrl === '',
      })
    }
    if (
      updates.audioTranscription !== undefined &&
      updates.audioTranscription !== null &&
      updates.audioTranscription !== ''
    ) {
      updateData.audioTranscription = updates.audioTranscription
    }
    if (updates.aiSummary !== undefined) {
      updateData.aiSummary = updates.aiSummary
    }
    if (updates.aiSummaryUpdatedAt !== undefined) {
      updateData.aiSummaryUpdatedAt = Timestamp.fromDate(
        updates.aiSummaryUpdatedAt,
      )
    }
    if (updates.aiSummaryModel !== undefined) {
      updateData.aiSummaryModel = updates.aiSummaryModel
    }
    if (updates.patientAuthorized !== undefined) {
      updateData.patientAuthorized = updates.patientAuthorized
    }
    if (updates.startedAt !== undefined) {
      updateData.startedAt = Timestamp.fromDate(updates.startedAt)
    }
    if (updates.endedAt !== undefined) {
      updateData.endedAt = Timestamp.fromDate(updates.endedAt)
    }

    await updateDoc(
      consultationRef,
      updateData as { [x: string]: FieldValue | Partial<unknown> },
    )

    return {
      success: true,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao atualizar consulta:', error)

    if (error instanceof FirebaseError) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Erro ao atualizar consulta',
    }
  }
}

export const cancelConsultation = async (
  consultationId: string,
): Promise<OperationResult> => {
  if (!consultationId) {
    return {
      success: false,
      error: 'ID da consulta é obrigatório',
    }
  }

  try {
    const consultationRef = doc(db, COLLECTION_NAME, consultationId)
    const consultationSnap = await getDoc(consultationRef)

    if (!consultationSnap.exists()) {
      return {
        success: false,
        error: 'Consulta não encontrada',
      }
    }

    const consultationData = consultationSnap.data()
    const doctorId = consultationData?.doctorId
    const date = consultationData?.date?.toDate
      ? consultationData.date.toDate()
      : new Date(consultationData?.date)
    const hour = consultationData?.hour || ''
    const dateTimeStr =
      hour && date
        ? `${hour}, ${date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}`
        : date?.toLocaleDateString('pt-BR') || 'data não informada'

    await updateDoc(consultationRef, {
      status: 'CANCELLED',
      updatedAt: Timestamp.now(),
    })

    if (doctorId) {
      notifyConsultationCanceled(doctorId, consultationId, dateTimeStr).catch(
        (err: unknown) =>
          console.error('Erro ao enviar notificação de cancelamento:', err),
      )
    }

    return {
      success: true,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao cancelar consulta:', error)

    if (error instanceof FirebaseError) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Erro ao cancelar consulta',
    }
  }
}

export const updateConsultationSoapField = async (
  consultationId: string,
  field: keyof SoapData,
  value: string,
): Promise<UpdateSoapResult> => {
  try {
    if (!consultationId) {
      return {
        success: false,
        error: 'ID da consulta é obrigatório',
      }
    }

    if (!['subjective', 'objective', 'assessment', 'plan'].includes(field)) {
      return {
        success: false,
        error: 'Campo SOAP inválido',
      }
    }

    const consultationRef = doc(db, COLLECTION_NAME, consultationId)
    const consultationSnap = await getDoc(consultationRef)

    if (!consultationSnap.exists()) {
      return {
        success: false,
        error: 'Consulta não encontrada',
      }
    }

    const consultationData = consultationSnap.data()
    const existingSoap = (consultationData?.soap as SoapData | undefined) || {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    }

    await updateDoc(consultationRef, {
      soap: {
        ...existingSoap,
        [field]: value,
      },
      updatedAt: Timestamp.now(),
    })

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    const errorMessage =
      error instanceof FirebaseError
        ? error.message
        : 'Erro ao atualizar dados SOAP'
    return {
      success: false,
      error: errorMessage,
    }
  }
}

export const updateConsultationTranscription = async (
  consultationId: string,
  transcription: string,
): Promise<OperationResult> => {
  try {
    if (!consultationId) {
      return {
        success: false,
        error: 'ID da consulta é obrigatório',
      }
    }

    const consultationRef = doc(db, COLLECTION_NAME, consultationId)

    await updateDoc(consultationRef, {
      audioTranscription: transcription,
      updatedAt: Timestamp.now(),
    })

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    const errorMessage =
      error instanceof FirebaseError
        ? error.message
        : 'Erro ao atualizar transcrição'
    return {
      success: false,
      error: errorMessage,
    }
  }
}
