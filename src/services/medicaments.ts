import { FirebaseError } from 'firebase/app'
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  updateDoc,
  where,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import {
  MedicationEntity,
  MedicationStatus,
  MedicationCreationBy,
} from '@/types/entities/medicaments'
import { normalizeMedication } from '@/utils/normalizeMedication'

const firestore = getFirestore(firebaseApp)

interface MedicamentsResult {
  medicaments: MedicationEntity[]
  error: string | null
}

/**
 * Busca todos os medicamentos ativos de um usuário
 * @param userId - ID do usuário
 * @returns Promise com array de medicamentos ativos ou erro
 */
export const getActiveMedicaments = async (
  userId: string,
): Promise<MedicamentsResult> => {
  if (!userId) {
    return {
      medicaments: [],
      error: 'ID do usuário é obrigatório',
    }
  }

  try {
    // Referência para a subcoleção de medicamentos do usuário
    const medicamentsRef = collection(firestore, 'users', userId, 'medications')
    // Query para buscar apenas medicamentos com status ACTIVE
    const q = query(
      medicamentsRef,
      where('status', '==', MedicationStatus.ACTIVE),
      orderBy('createdAt', 'desc'),
    )

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return {
        medicaments: [],
        error: null,
      }
    }

    // Transformar documentos em array de MedicationEntity
    const medicaments: MedicationEntity[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as DocumentData

      return normalizeMedication({
        id: doc.id,
        userId: data.userId || userId,
        ...data,
      }) as MedicationEntity
    })

    return {
      medicaments,
      error: null,
    }
  } catch (error) {
    console.error('Erro ao buscar medicamentos ativos:', error)
    let errorMessage = 'Erro interno do servidor'
    if (error instanceof FirebaseError) {
      errorMessage = `Erro no Firebase: ${error.message}`
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      medicaments: [],
      error: errorMessage,
    }
  }
}

/**
 * Busca medicamentos para exibição na tabela: ativos (cadastrados pelo paciente
 * ou prescritos pelo médico) e prescrições do médico com status CREATED.
 * @param userId - ID do usuário (paciente)
 * @returns Promise com array de medicamentos para exibir ou erro
 */
export const getMedicamentsForDisplay = async (
  userId: string,
): Promise<MedicamentsResult> => {
  if (!userId) {
    return {
      medicaments: [],
      error: 'ID do usuário é obrigatório',
    }
  }

  try {
    const medicamentsRef = collection(firestore, 'users', userId, 'medications')

    // 1) Medicamentos ativos (cadastrados pelo paciente ou já ativados pelo médico)
    const qActive = query(
      medicamentsRef,
      where('status', '==', MedicationStatus.ACTIVE),
      orderBy('createdAt', 'desc'),
    )

    // 2) Medicamentos prescritos pelo médico ainda com status CREATED
    const qPrescribedCreated = query(
      medicamentsRef,
      where('status', '==', MedicationStatus.CREATED),
      where('createdBy', '==', MedicationCreationBy.DOCTOR),
      orderBy('createdAt', 'desc'),
    )

    const [activeSnapshot, prescribedSnapshot] = await Promise.all([
      getDocs(qActive),
      getDocs(qPrescribedCreated),
    ])

    const toEntity = (
      snapshot: QueryDocumentSnapshot<DocumentData>,
    ): MedicationEntity =>
      normalizeMedication({
        id: snapshot.id,
        userId: (snapshot.data().userId as string) || userId,
        ...snapshot.data(),
      }) as MedicationEntity

    const activeList = activeSnapshot.docs.map(toEntity)
    const prescribedList = prescribedSnapshot.docs.map(toEntity)

    // Unir e remover duplicatas por id (priorizar ativos)
    const byId = new Map<string, MedicationEntity>()
    for (const m of activeList) byId.set(m.id, m)
    for (const m of prescribedList) if (!byId.has(m.id)) byId.set(m.id, m)

    const getCreatedTime = (m: MedicationEntity): number => {
      const c = m.createdAt
      if (!c) return 0
      if (typeof (c as { toDate?: () => Date }).toDate === 'function') {
        return (c as { toDate: () => Date }).toDate().getTime()
      }
      if (c instanceof Date) return c.getTime()
      return 0
    }
    const medicaments = Array.from(byId.values()).sort(
      (a, b) => getCreatedTime(b) - getCreatedTime(a),
    )

    return {
      medicaments,
      error: null,
    }
  } catch (error) {
    console.error('Erro ao buscar medicamentos para exibição:', error)
    let errorMessage = 'Erro interno do servidor'
    if (error instanceof FirebaseError) {
      errorMessage = `Erro no Firebase: ${error.message}`
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    return {
      medicaments: [],
      error: errorMessage,
    }
  }
}

/**
 * Busca todos os medicamentos de um usuário (independente do status)
 * @param userId - ID do usuário
 * @returns Promise com array de medicamentos ou erro
 */
export const getAllMedicaments = async (
  userId: string,
): Promise<MedicamentsResult> => {
  if (!userId) {
    return {
      medicaments: [],
      error: 'ID do usuário é obrigatório',
    }
  }

  try {
    const medicamentsRef = collection(firestore, 'users', userId, 'medicaments')
    const q = query(medicamentsRef, orderBy('createdAt', 'desc'))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return {
        medicaments: [],
        error: null,
      }
    }

    const medicaments: MedicationEntity[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as DocumentData

      return normalizeMedication({
        id: doc.id,
        userId: data.userId || userId,
        ...data,
      }) as MedicationEntity
    })

    return {
      medicaments,
      error: null,
    }
  } catch (error) {
    console.error('Erro ao buscar medicamentos:', error)
    let errorMessage = 'Erro interno do servidor'
    if (error instanceof FirebaseError) {
      errorMessage = `Erro no Firebase: ${error.message}`
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      medicaments: [],
      error: errorMessage,
    }
  }
}

/**
 * Busca medicamentos por status específico
 * @param userId - ID do usuário
 * @param status - Status do medicamento
 * @returns Promise com array de medicamentos ou erro
 */
export const getMedicamentsByStatus = async (
  userId: string,
  status: MedicationStatus,
): Promise<MedicamentsResult> => {
  if (!userId) {
    return {
      medicaments: [],
      error: 'ID do usuário é obrigatório',
    }
  }

  try {
    const medicamentsRef = collection(firestore, 'users', userId, 'medicaments')
    const q = query(
      medicamentsRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
    )

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return {
        medicaments: [],
        error: null,
      }
    }

    const medicaments: MedicationEntity[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as DocumentData

      return normalizeMedication({
        id: doc.id,
        userId: data.userId || userId,
        ...data,
      }) as MedicationEntity
    })

    return {
      medicaments,
      error: null,
    }
  } catch (error) {
    console.error('Erro ao buscar medicamentos por status:', error)
    let errorMessage = 'Erro interno do servidor'
    if (error instanceof FirebaseError) {
      errorMessage = `Erro no Firebase: ${error.message}`
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      medicaments: [],
      error: errorMessage,
    }
  }
}

/**
 * Suspende um medicamento mudando seu status para SUSPENDED
 * @param userId - ID do usuário
 * @param medicationId - ID do medicamento
 * @returns Promise com sucesso ou erro
 */
export const suspendMedication = async (
  userId: string,
  medicationId: string,
): Promise<{ success: boolean; error: string | null }> => {
  if (!userId || !medicationId) {
    return {
      success: false,
      error: 'ID do usuário e ID do medicamento são obrigatórios',
    }
  }

  try {
    // Referência para o documento específico do medicamento
    const medicationRef = doc(
      firestore,
      'users',
      userId,
      'medications',
      medicationId,
    )

    await updateDoc(medicationRef, {
      status: MedicationStatus.SUSPENDED,
      updatedAt: new Date(),
    })

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    console.error('Erro ao suspender medicamento:', error)
    let errorMessage = 'Erro interno do servidor'
    if (error instanceof FirebaseError) {
      errorMessage = `Erro no Firebase: ${error.message}`
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
