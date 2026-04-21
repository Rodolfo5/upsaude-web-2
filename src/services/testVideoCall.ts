/**
 * 🎥 SERVICE DE TESTE DE VIDEOCHAMADA
 *
 * Este arquivo centraliza todas as operações relacionadas a videochamadas de teste,
 * incluindo o gerenciamento de dados SOAP.
 *
 * Funcionalidades principais:
 * - CRUD de dados SOAP
 * - Type safety com TypeScript
 * - Tratamento consistente de erros
 */

import { FirebaseError } from 'firebase/app'
import {
  doc,
  getDoc,
  getFirestore,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'

const db = getFirestore(firebaseApp)

// ====================================================================
// 📋 TIPOS
// ====================================================================

/**
 * Estrutura de dados SOAP
 */
export interface SoapData {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

/**
 * Resultado de operações SOAP
 */
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
 * Busca os dados SOAP de uma chamada específica
 * @param callId - ID da chamada
 * @returns Dados SOAP ou erro
 */
export const getSoapData = async (callId: string): Promise<SoapResult> => {
  try {
    if (!callId) {
      return {
        data: null,
        error: 'ID da chamada é obrigatório',
      }
    }

    const callRef = doc(db, 'testVideoCalls', callId)
    const callSnap = await getDoc(callRef)

    if (!callSnap.exists()) {
      return {
        data: null,
        error: 'Chamada não encontrada',
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
 * @param callId - ID da chamada
 * @param field - Campo a ser atualizado (subjective, objective, assessment, plan)
 * @param value - Novo valor do campo
 * @returns Resultado da operação
 */
export const updateSoapField = async (
  callId: string,
  field: keyof SoapData,
  value: string,
): Promise<UpdateSoapResult> => {
  try {
    if (!callId) {
      return {
        success: false,
        error: 'ID da chamada é obrigatório',
      }
    }

    if (!['subjective', 'objective', 'assessment', 'plan'].includes(field)) {
      return {
        success: false,
        error: 'Campo SOAP inválido',
      }
    }

    const callRef = doc(db, 'testVideoCalls', callId)

    // Primeiro, busca os dados existentes do documento principal
    const callSnap = await getDoc(callRef)

    if (!callSnap.exists()) {
      return {
        success: false,
        error: 'Chamada não encontrada',
      }
    }

    const callData = callSnap.data()
    const existingSoap = (callData?.soap as SoapData | undefined) || {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    }

    // Atualiza apenas o campo especificado usando notação de ponto
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

/**
 * Atualiza todos os campos do SOAP de uma vez
 * @param callId - ID da chamada
 * @param soapData - Dados SOAP completos
 * @returns Resultado da operação
 */
export const updateSoapData = async (
  callId: string,
  soapData: SoapData,
): Promise<UpdateSoapResult> => {
  try {
    if (!callId) {
      return {
        success: false,
        error: 'ID da chamada é obrigatório',
      }
    }

    const callRef = doc(db, 'testVideoCalls', callId)

    // Verifica se o documento existe
    const callSnap = await getDoc(callRef)

    if (!callSnap.exists()) {
      return {
        success: false,
        error: 'Chamada não encontrada',
      }
    }

    // Atualiza o objeto soap completo no documento principal
    await updateDoc(callRef, {
      soap: soapData,
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
