import { FirebaseError } from 'firebase/app'
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
  updateDoc,
  Timestamp,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import {
  getApiErrorMessage,
  postAuthenticatedJson,
} from '@/services/api/authenticatedFetch'
import { PatientEntity, UserRole } from '@/types/entities/user'

import { sendPatientWelcome } from './email/email'
import { notifyPlanReevaluationRequested } from './emailNotification'
import { sendPatientWelcomeSMS } from './notification/sms'

const db = getFirestore(firebaseApp)

const USERS_COLLECTION = 'users'

interface PatientsResult {
  patients: PatientEntity[]
  error: string | null
}

// Firestore 'in' queries aceitam no máximo 30 IDs por batch
const FIRESTORE_IN_LIMIT = 30

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

export const getPatientsByIds = async (
  patientIds: string[],
): Promise<PatientsResult> => {
  if (!patientIds || patientIds.length === 0) {
    return { patients: [], error: null }
  }

  try {
    const usersRef = collection(db, USERS_COLLECTION)
    const uniqueIds = [...new Set(patientIds)]
    const batches = chunkArray(uniqueIds, FIRESTORE_IN_LIMIT)

    // Todos os batches em paralelo — O(ceil(n/30)) roundtrips em vez de O(n)
    const snapshots = await Promise.all(
      batches.map((chunk) =>
        getDocs(query(usersRef, where(documentId(), 'in', chunk))),
      ),
    )

    const patients: PatientEntity[] = []
    for (const snapshot of snapshots) {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        patients.push({
          id: docSnap.id,
          uid: docSnap.id,
          name: data.name || '',
          email: data.email || '',
          role: data.role,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          ...data,
        } as PatientEntity)
      })
    }

    return { patients, error: null }
  } catch (error: unknown) {
    console.error('Erro ao buscar pacientes:', error)
    if (error instanceof FirebaseError) {
      return { patients: [], error: error.message }
    }
    return {
      patients: [],
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao buscar dados dos pacientes',
    }
  }
}

export const getPatientsByDoctorId = async (
  doctorId: string,
): Promise<PatientsResult> => {
  if (!doctorId) {
    return {
      patients: [],
      error: 'DoctorId é obrigatório',
    }
  }

  try {
    const usersRef = collection(db, USERS_COLLECTION)
    const q = query(usersRef, where('doctorId', '==', doctorId))
    const querySnapshot = await getDocs(q)

    const patients: PatientEntity[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      patients.push({
        id: doc.id,
        uid: doc.id,
        name: data.name || '',
        email: data.email || '',
        role: data.role,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        steps: data.steps || 0,
        phoneNumber: data.phoneNumber || '',
        weight: data.weight || 0,
        height: data.height || 0,
        // Map other required fields for PatientEntity here
        ...data,
      } as PatientEntity)
    })

    return {
      patients,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao buscar pacientes por doctorId:', error)

    if (error instanceof FirebaseError) {
      return {
        patients: [],
        error: error.message,
      }
    }

    return {
      patients: [],
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao buscar pacientes por doctorId',
    }
  }
}

interface CreatePatientData {
  name: string
  email: string
  phone: string
  doctorId: string
  steps: string
}

export const createPatient = async (
  data: CreatePatientData,
): Promise<{ uid: string; warnings: string[] }> => {
  try {
    const { response, data: apiResult } = await postAuthenticatedJson<{
      uid?: string | null
      password?: string | null
      error?: string | null
      warnings?: string[]
    }>('/api/createPatient', data)

    if (!response.ok || !apiResult?.uid || !apiResult.password) {
      throw new Error(
        getApiErrorMessage(apiResult, 'Erro ao criar conta de autenticacao'),
      )
    }

    const warnings = [...(apiResult.warnings ?? [])]

    const notificationResults = await Promise.allSettled([
      sendPatientWelcome({
        name: data.name,
        email: data.email,
        password: apiResult.password,
      }),
      sendPatientWelcomeSMS({
        name: data.name,
        phone: data.phone,
        password: apiResult.password,
        email: data.email,
      }),
    ])

    notificationResults.forEach((result) => {
      if (result.status === 'rejected') {
        warnings.push(
          result.reason instanceof Error
            ? result.reason.message
            : 'Falha ao enviar uma notificacao de boas-vindas.',
        )
        return
      }

      if (result.value.error) {
        warnings.push(result.value.error)
      }
    })

    return {
      uid: apiResult.uid,
      warnings,
    }
  } catch (err) {
    console.error('Erro ao criar paciente:', err)

    if (err instanceof FirebaseError) {
      throw new Error(err.message)
    }

    throw new Error(
      err instanceof Error ? err.message : 'Erro ao criar paciente',
    )
  }
}

export const updatePatient = async (
  patientId: string,
  updateData: Partial<PatientEntity>,
): Promise<void> => {
  if (!patientId) {
    throw new Error('patientId é obrigatório')
  }

  try {
    await updateDoc(doc(db, USERS_COLLECTION, patientId), {
      ...updateData,
      updatedAt: Timestamp.now(),
    })

    if (updateData.planReassessment === true) {
      const patientDoc = await getDoc(doc(db, USERS_COLLECTION, patientId))
      const patientData = patientDoc.data()
      const doctorId = patientData?.doctorId || updateData.doctorId
      const patientName = patientData?.name || updateData.name || 'Paciente'

      if (doctorId) {
        const plansRef = collection(
          db,
          USERS_COLLECTION,
          patientId,
          'therapeuticPlans',
        )
        const plansSnapshot = await getDocs(
          query(plansRef, where('status', '==', 'active')),
        )
        const activePlanId = plansSnapshot.empty
          ? null
          : plansSnapshot.docs[0]?.id

        if (activePlanId) {
          notifyPlanReevaluationRequested(
            doctorId,
            patientId,
            activePlanId,
            patientName,
          ).catch((err: unknown) =>
            console.error('Erro ao enviar notificação de reavaliação:', err),
          )
        }
      }
    }
  } catch (error: unknown) {
    console.error('Erro ao atualizar paciente:', error)

    if (error instanceof FirebaseError) {
      throw new Error(error.message)
    }

    throw new Error(
      error instanceof Error ? error.message : 'Erro ao atualizar paciente',
    )
  }
}

export const getPatientById = async (
  patientId: string,
): Promise<{ patient?: PatientEntity; error: string | null }> => {
  if (!patientId) {
    return { patient: undefined, error: 'patientId é obrigatório' }
  }

  try {
    // Primeiro, tenta buscar pelo ID do documento (para pacientes novos criados com setDoc)
    const patientDocRef = doc(db, USERS_COLLECTION, patientId)
    let patientDoc = await getDoc(patientDocRef)

    // Se não encontrou, pode ser um paciente antigo criado com addDoc
    // Nesse caso, o ID do documento é diferente do UID do Auth
    // Precisamos buscar pelo campo 'id' dentro dos documentos
    if (!patientDoc.exists()) {
      console.log(
        '⚠️ Paciente não encontrado pelo ID do documento, buscando pelo campo id...',
        { patientId },
      )

      // Busca todos os pacientes e procura pelo campo 'id' que contém o UID do Auth
      const patientsQuery = query(
        collection(db, USERS_COLLECTION),
        where('id', '==', patientId),
        where('role', '==', UserRole.PATIENT),
      )
      const querySnapshot = await getDocs(patientsQuery)

      if (!querySnapshot.empty) {
        // Encontrou pelo campo 'id', usa o primeiro resultado
        patientDoc = querySnapshot.docs[0]
      } else {
        // Tenta também buscar diretamente pelo ID do documento (pode ser que o patientId já seja o ID do documento)
        return {
          patient: undefined,
          error: 'Paciente não encontrado. Verifique se o ID está correto.',
        }
      }
    }

    const data = patientDoc.data()

    if (!data) {
      return {
        patient: undefined,
        error: 'Dados do paciente não encontrados.',
      }
    }

    const patient: PatientEntity = {
      id: patientDoc.id,
      uid: patientDoc.id,
      name: data.name || '',
      email: data.email || '',
      role: data.role,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      steps: data.steps || '',
      phoneNumber: data.phoneNumber || '',
      weight: data.weight || '',
      height: data.height || '',
      socialName: data.socialName || '',
      sex: data.sex || '',
      gender: data.gender || '',
      bloodType: data.bloodType || '',
      cep: data.cep || '',
      address: data.address || '',
      number: data.number || '',
      complement: data.complement || '',
      neighborhood: data.neighborhood || '',
      city: data.city || '',
      state: data.state || '',
      initialConsultation: data.initialConsultation || false,
      doctorId: data.doctorId || undefined,
      isDependent: data.isDependent || false,
      accountHolder: data.accountHolder || undefined,
      dependents: data.dependents || undefined,
      profileImage: data.profileImage || undefined,
      riskClassification: data.riskClassification || undefined,
      justificationChangeRiskClassification:
        data.justificationChangeRiskClassification || undefined,
      planReassessment:
        data.planReassessment !== undefined
          ? Boolean(data.planReassessment)
          : false,
      score: data.score !== undefined ? Number(data.score) : undefined,
      cpf: data.cpf || undefined,
      birthDate:
        data.birthDate?.toDate != null
          ? data.birthDate.toDate()
          : data.birthDate || undefined,
      tokens: data.tokens ?? [],
    }

    return { patient, error: null }
  } catch (error: unknown) {
    console.error('Erro ao buscar paciente por id:', error)

    if (error instanceof FirebaseError) {
      return { patient: undefined, error: error.message }
    }

    return {
      patient: undefined,
      error: error instanceof Error ? error.message : 'Erro ao buscar paciente',
    }
  }
}
