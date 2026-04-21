import { FirebaseError } from 'firebase/app'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import {
  getApiErrorMessage,
  postAuthenticatedJson,
} from '@/services/api/authenticatedFetch'
import { AgendaEntity } from '@/types/entities/agenda'
import { DoctorEntity, UserRole } from '@/types/entities/user'

import { sendDoctorWelcome } from './email/email'

const db = getFirestore(firebaseApp)

const USERS_COLLECTION = 'users'

/**
 * Verifica se um CRM já está sendo usado por outro médico no banco de dados
 * @param crm - Número do CRM (apenas números)
 * @param crmState - Estado do CRM (2 caracteres)
 * @param excludeUserId - ID do usuário a ser excluído da verificação (útil ao editar)
 * @returns Objeto indicando se está em uso e informações do médico que usa o CRM
 */
export const checkCrmInUse = async (
  crm: string,
  crmState: string,
  excludeUserId?: string,
): Promise<{
  inUse: boolean
  doctor?: {
    id: string
    name: string
    email: string
  }
  error?: string
}> => {
  try {
    const cleanCrm = crm.replace(/\D/g, '')
    const upperCrmState = crmState.toUpperCase()

    if (!cleanCrm || cleanCrm.length === 0) {
      return {
        inUse: false,
        error: 'CRM inválido',
      }
    }

    if (!upperCrmState || upperCrmState.length !== 2) {
      return {
        inUse: false,
        error: 'Estado do CRM inválido',
      }
    }

    const usersRef = collection(db, USERS_COLLECTION)
    const q = query(
      usersRef,
      where('credential', '==', cleanCrm),
      where('typeOfCredential', '==', 'CRM'),
      where('role', '==', UserRole.DOCTOR),
    )

    const querySnapshot = await getDocs(q)

    // Verifica se encontrou algum médico com esse CRM
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data()

      // Se fornecido excludeUserId, ignora esse usuário (útil para edição)
      if (excludeUserId && docSnapshot.id === excludeUserId) {
        continue
      }

      // Verifica se o estado do CRM também corresponde
      // Nota: O estado pode estar armazenado em 'state' ou 'credentialState'
      const doctorState =
        data.state || data.credentialState || data.crmState || ''

      if (doctorState.toUpperCase() === upperCrmState) {
        return {
          inUse: true,
          doctor: {
            id: docSnapshot.id,
            name: data.name || '',
            email: data.email || '',
          },
        }
      }
    }

    return {
      inUse: false,
    }
  } catch (error) {
    console.error('❌ Erro ao verificar se CRM está em uso:', {
      timestamp: new Date().toISOString(),
      crm: crm.replace(/\D/g, ''),
      crmState: crmState.toUpperCase(),
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    })

    return {
      inUse: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao verificar se CRM está em uso',
    }
  }
}

interface CreateDoctorData {
  name: string
  email: string
  cpf: string
  birthDate: Date
  state: string
  crm?: string
  crmState?: string
  specialty?: string
}

export const createDoctor = async (
  data: CreateDoctorData,
): Promise<{ uid: string; password: string; warnings: string[] }> => {
  try {
    const { response, data: apiResult } = await postAuthenticatedJson<{
      uid?: string | null
      password?: string | null
      error?: string | null
      warnings?: string[]
    }>('/api/createDoctor', {
      ...data,
      birthDate: data.birthDate.toISOString(),
    })

    if (!response.ok || !apiResult?.uid || !apiResult.password) {
      throw new Error(
        getApiErrorMessage(apiResult, 'Erro ao criar conta de autenticacao'),
      )
    }

    const warnings = [...(apiResult.warnings ?? [])]

    const emailResult = await sendDoctorWelcome({
      name: data.name,
      email: data.email,
      password: apiResult.password,
    })

    if (emailResult.error) {
      warnings.push(emailResult.error)
    }

    return {
      uid: apiResult.uid,
      password: apiResult.password,
      warnings,
    }
  } catch (err) {
    console.error('Erro ao criar médico:', err)

    if (err instanceof FirebaseError) {
      throw new Error(err.message)
    }

    throw new Error(err instanceof Error ? err.message : 'Erro ao criar médico')
  }
}

export async function findDoctorById(
  doctorId: string,
): Promise<DoctorEntity | null> {
  const snap = await getDoc(doc(db, 'users', doctorId))
  const data = snap.data() as DoctorEntity
  if (!snap.exists() || !data || data.role !== 'DOCTOR') return null

  // Buscar agenda do médico
  try {
    const agendaSnapshot = await getDocs(
      collection(db, 'users', doctorId, 'agenda'),
    )

    let agendaData: AgendaEntity | undefined
    if (!agendaSnapshot.empty) {
      agendaData = agendaSnapshot.docs[0].data() as AgendaEntity
    }

    return {
      ...data,
      id: snap.id,
      agenda: agendaData,
    } as DoctorEntity
  } catch (error) {
    console.error(`Erro ao buscar agenda do médico ${doctorId}:`, error)
    return {
      ...data,
      id: snap.id,
    } as DoctorEntity
  }
}
