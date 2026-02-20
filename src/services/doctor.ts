import { FirebaseError } from 'firebase/app'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import { AgendaEntity } from '@/types/entities/agenda'
import { DoctorEntity, UserRole } from '@/types/entities/user'
import { generateRandomPassword } from '@/utils/generateRandomPassword'

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
): Promise<{ uid: string; password: string }> => {
  const generatedPassword = generateRandomPassword()

  try {
    // Cria usuário no Auth usando Admin SDK via API
    const response = await fetch('/api/createDoctor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        password: generatedPassword,
      }),
    })

    const authResult = await response.json()

    if (!response.ok || authResult.error || !authResult.uid) {
      throw new Error(authResult.error || 'Erro ao criar conta de autenticação')
    }

    await setDoc(doc(db, USERS_COLLECTION, authResult.uid), {
      name: data.name,
      email: data.email,
      cpf: data.cpf,
      birthDate: data.birthDate.toISOString(),
      state: data.state,
      credential: data.crm,
      credentialState: data.crmState, // Estado do CRM
      typeOfCredential: 'CRM',
      specialty: data.specialty,
      role: UserRole.DOCTOR,
      status: 'APPROVED',
      currentStep: 2,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Integração com Memed (não bloqueia criação se falhar)
    if (data.crm && data.crmState) {
      try {
        // Separa nome e sobrenome
        const nameParts = data.name.trim().split(/\s+/)
        const firstName = nameParts[0] || data.name
        const surname = nameParts.slice(1).join(' ') || ''

        const memedResponse = await fetch('/api/memed/register-doctor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            externalId: authResult.uid, // Usa o UID do Firebase como external_id
            name: firstName,
            surname: surname || firstName, // Se não tiver sobrenome, usa o nome
            email: data.email,
            cpf: data.cpf,
            birthDate: data.birthDate.toISOString(),
            crm: data.crm,
            crmState: data.crmState,
            // phone, gender, cityId, specialtyId podem ser adicionados depois
          }),
        })

        const memedResult = await memedResponse.json()

        if (memedResult.success && memedResult.memedId) {
          // Atualizar documento com memedId e token se disponível
          const updateData: {
            memedId: string
            memedRegistered: boolean
            updatedAt: Date
            token?: string
          } = {
            memedId: memedResult.memedId,
            memedRegistered: true,
            updatedAt: new Date(),
          }

          // Salva o token do prescritor se retornado
          if (memedResult.prescriberToken) {
            updateData.token = memedResult.prescriberToken
          }

          await updateDoc(doc(db, USERS_COLLECTION, authResult.uid), updateData)

          // Log de sucesso da integração MEMED destacando o memedId
        } else {
          console.warn(
            'Médico criado, mas falha ao registrar na Memed:',
            memedResult.error,
          )
        }
      } catch (error) {
        console.error('Erro na integração Memed (não bloqueia criação):', error)
        // Não bloqueia a criação do médico se Memed falhar
      }
    }

    // Envia comunicações (sem bloquear o fluxo principal)
    Promise.all([
      sendDoctorWelcome({
        name: data.name,
        email: data.email,
        password: generatedPassword,
      }),
    ])

    return { uid: authResult.uid, password: generatedPassword }
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
