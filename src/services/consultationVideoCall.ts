/**
 * 🎥 SERVICE DE VIDEOCHAMADA DE CONSULTA
 *
 * Este arquivo centraliza todas as operações relacionadas a videochamadas de consultas,
 * incluindo o gerenciamento de dados SOAP.
 *
 * Funcionalidades principais:
 * - CRUD de videochamadas dentro de consultas (subcollection)
 * - CRUD de dados SOAP
 * - Type safety com TypeScript
 * - Tratamento consistente de erros
 */

import { FirebaseError } from 'firebase/app'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'

import firebaseApp from '@/config/firebase/app'

const db = getFirestore(firebaseApp)

// ====================================================================
// 📋 TIPOS
// ====================================================================

export type CallStatus = 'active' | 'ended'

export interface VideoCall {
  id: string
  consultationId: string
  channelName: string
  hostId: string
  hostName: string
  patientId: string
  patientName?: string
  status: CallStatus
  createdAt: any
  updatedAt?: any
  endedAt?: any
}

export interface SoapData {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

interface CreateVideoCallResult {
  callId: string | null
  error: string | null
}

interface VideoCallResult {
  call: VideoCall | null
  error: string | null
}

interface SoapResult {
  data: SoapData | null
  error: string | null
}

interface UpdateSoapResult {
  success: boolean
  error: string | null
}

// ====================================================================
// 🔧 FUNÇÕES DO SERVICE
// ====================================================================

/**
 * Cria uma nova videochamada para uma consulta
 * @param consultationId - ID da consulta
 * @param hostId - ID do médico (host)
 * @param hostName - Nome do médico
 * @param patientId - ID do paciente
 * @param patientName - Nome do paciente (opcional)
 * @returns ID da videochamada criada ou erro
 */
export const createVideoCall = async (
  consultationId: string,
  hostId: string,
  hostName: string,
  patientId: string,
  patientName?: string,
): Promise<CreateVideoCallResult> => {
  try {
    if (!consultationId || !hostId || !hostName || !patientId) {
      return {
        callId: null,
        error: 'Dados obrigatórios faltando',
      }
    }

    // Verificar se a consulta existe
    const consultationRef = doc(db, 'consultations', consultationId)
    const consultationSnap = await getDoc(consultationRef)

    if (!consultationSnap.exists()) {
      return {
        callId: null,
        error: 'Consulta não encontrada',
      }
    }

    // Se já existe chamada ativa (ex.: reentrar após fechar aba), retorna ela em vez de criar outra
    const existing = await getActiveVideoCall(consultationId)
    if (existing.call) {
      return { callId: existing.call.id, error: null }
    }
    if (existing.error) {
      return { callId: null, error: existing.error }
    }

    // Criar videochamada na subcollection
    const videoCallsRef = collection(
      db,
      'consultations',
      consultationId,
      'videoCalls',
    )

    // Gerar channelName curto (máximo 64 bytes para Agora)
    // Usar apenas UUID sem hífens para garantir unicidade e tamanho adequado
    const channelName = uuidv4().replace(/-/g, '')

    const newCallRef = await addDoc(videoCallsRef, {
      consultationId,
      channelName,
      hostId,
      hostName,
      patientId,
      patientName: patientName || null,
      status: 'active' as CallStatus,
      createdAt: serverTimestamp(),
    })

    return {
      callId: newCallRef.id,
      error: null,
    }
  } catch (error) {
    console.error('Erro ao criar videochamada:', error)
    const errorMessage =
      error instanceof FirebaseError
        ? error.message
        : 'Erro ao criar videochamada'
    return {
      callId: null,
      error: errorMessage,
    }
  }
}

/**
 * Busca uma videochamada ativa para a consulta (para reentrar na chamada).
 * @param consultationId - ID da consulta
 * @returns A videochamada ativa ou null
 */
export const getActiveVideoCall = async (
  consultationId: string,
): Promise<VideoCallResult> => {
  try {
    if (!consultationId) {
      return { call: null, error: 'consultationId é obrigatório' }
    }
    const videoCallsRef = collection(
      db,
      'consultations',
      consultationId,
      'videoCalls',
    )
    const q = query(videoCallsRef, where('status', '==', 'active'))
    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      return { call: null, error: null }
    }
    const docSnap = snapshot.docs[0]
    const data = docSnap.data()
    const call: VideoCall = {
      id: docSnap.id,
      consultationId: data.consultationId,
      channelName: data.channelName,
      hostId: data.hostId,
      hostName: data.hostName,
      patientId: data.patientId,
      patientName: data.patientName,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      endedAt: data.endedAt,
    }
    return { call, error: null }
  } catch (error) {
    console.error('Erro ao buscar videochamada ativa:', error)
    const errorMessage =
      error instanceof FirebaseError
        ? error.message
        : 'Erro ao buscar videochamada ativa'
    return { call: null, error: errorMessage }
  }
}

/**
 * Busca uma videochamada específica
 * @param consultationId - ID da consulta
 * @param callId - ID da videochamada
 * @returns Videochamada ou erro
 */
export const getVideoCall = async (
  consultationId: string,
  callId: string,
): Promise<VideoCallResult> => {
  try {
    if (!consultationId || !callId) {
      return {
        call: null,
        error: 'IDs obrigatórios faltando',
      }
    }

    const callRef = doc(
      db,
      'consultations',
      consultationId,
      'videoCalls',
      callId,
    )
    const callSnap = await getDoc(callRef)

    if (!callSnap.exists()) {
      return {
        call: null,
        error: 'Videochamada não encontrada',
      }
    }

    const data = callSnap.data()
    const call: VideoCall = {
      id: callSnap.id,
      consultationId: data.consultationId,
      channelName: data.channelName,
      hostId: data.hostId,
      hostName: data.hostName,
      patientId: data.patientId,
      patientName: data.patientName,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      endedAt: data.endedAt,
    }

    return {
      call,
      error: null,
    }
  } catch (error) {
    console.error('Erro ao buscar videochamada:', error)
    const errorMessage =
      error instanceof FirebaseError
        ? error.message
        : 'Erro ao buscar videochamada'
    return {
      call: null,
      error: errorMessage,
    }
  }
}

/**
 * Encerra uma videochamada
 * @param consultationId - ID da consulta
 * @param callId - ID da videochamada
 * @returns Resultado da operação
 */
export const endVideoCall = async (
  consultationId: string,
  callId: string,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    if (!consultationId || !callId) {
      return {
        success: false,
        error: 'IDs obrigatórios faltando',
      }
    }

    const callRef = doc(
      db,
      'consultations',
      consultationId,
      'videoCalls',
      callId,
    )

    await updateDoc(callRef, {
      status: 'ended' as CallStatus,
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    console.error('Erro ao encerrar videochamada:', error)
    const errorMessage =
      error instanceof FirebaseError
        ? error.message
        : 'Erro ao encerrar videochamada'
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Busca os dados SOAP de uma videochamada específica
 * @param consultationId - ID da consulta
 * @param callId - ID da videochamada
 * @returns Dados SOAP ou erro
 */
export const getSoapData = async (
  consultationId: string,
  callId: string,
): Promise<SoapResult> => {
  try {
    if (!consultationId || !callId) {
      return {
        data: null,
        error: 'IDs obrigatórios faltando',
      }
    }

    const callRef = doc(
      db,
      'consultations',
      consultationId,
      'videoCalls',
      callId,
    )
    const callSnap = await getDoc(callRef)

    if (!callSnap.exists()) {
      return {
        data: null,
        error: 'Videochamada não encontrada',
      }
    }

    const callData = callSnap.data()
    const soap = callData?.soap as SoapData | undefined

    // Se não existe o objeto soap, retorna dados vazios
    if (!soap) {
      return {
        data: {
          subjective: '',
          objective: '',
          assessment: '',
          plan: '',
        },
        error: null,
      }
    }

    return {
      data: {
        subjective: soap.subjective || '',
        objective: soap.objective || '',
        assessment: soap.assessment || '',
        plan: soap.plan || '',
      },
      error: null,
    }
  } catch (error) {
    const errorMessage =
      error instanceof FirebaseError
        ? error.message
        : 'Erro ao buscar dados SOAP'
    return {
      data: null,
      error: errorMessage,
    }
  }
}

/**
 * Atualiza um campo específico do SOAP
 * @param consultationId - ID da consulta
 * @param callId - ID da videochamada
 * @param field - Campo a ser atualizado (subjective, objective, assessment, plan)
 * @param value - Novo valor do campo
 * @returns Resultado da operação
 */
export const updateSoapField = async (
  consultationId: string,
  callId: string,
  field: keyof SoapData,
  value: string,
): Promise<UpdateSoapResult> => {
  try {
    if (!consultationId || !callId) {
      return {
        success: false,
        error: 'IDs obrigatórios faltando',
      }
    }

    if (!['subjective', 'objective', 'assessment', 'plan'].includes(field)) {
      return {
        success: false,
        error: 'Campo SOAP inválido',
      }
    }

    const callRef = doc(
      db,
      'consultations',
      consultationId,
      'videoCalls',
      callId,
    )

    // Primeiro, busca os dados existentes
    const callSnap = await getDoc(callRef)

    if (!callSnap.exists()) {
      return {
        success: false,
        error: 'Videochamada não encontrada',
      }
    }

    const callData = callSnap.data()
    const existingSoap = (callData?.soap as SoapData | undefined) || {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    }

    // Atualiza apenas o campo especificado
    await updateDoc(callRef, {
      soap: {
        ...existingSoap,
        [field]: value,
      },
      updatedAt: serverTimestamp(),
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
