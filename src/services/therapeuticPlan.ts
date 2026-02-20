import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import { TherapeuticPlanEntity } from '@/types/entities/therapeuticPlan'

const firestore = getFirestore(firebaseApp)

/**
 * Cria um novo plano terapêutico na subcoleção do paciente
 */
export async function createTherapeuticPlan(
  patientId: string,
  planData: Partial<TherapeuticPlanEntity>,
): Promise<TherapeuticPlanEntity> {
  if (!patientId) {
    throw new Error('patientId é obrigatório')
  }

  // Criar referência para a subcoleção therapeuticPlans dentro do documento do usuário
  // Estrutura: users/{patientId}/therapeuticPlans/{planId}
  const planRef = doc(
    collection(firestore, 'users', patientId, 'therapeuticPlans'),
  )
  const planId = planRef.id

  const now = new Date()

  const newPlan: TherapeuticPlanEntity = {
    id: planId,
    patientId,
    doctorId: planData.doctorId || '',
    objective: planData.objective || '',
    reevaluationPeriod: planData.reevaluationPeriod || 6,
    reevaluationPeriodUnit: planData.reevaluationPeriodUnit || 'Meses',
    status: planData.status || 'draft',
    createdBy: planData.createdBy || '',
    createdAt: now,
    updatedAt: now,
    ...planData,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firestoreData: any = {
    ...newPlan,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  }

  // Converter campos de data para Timestamp se necessário
  if (newPlan.aiGeneratedAt) {
    firestoreData.aiGeneratedAt =
      newPlan.aiGeneratedAt instanceof Date
        ? Timestamp.fromDate(newPlan.aiGeneratedAt)
        : typeof newPlan.aiGeneratedAt === 'string'
          ? Timestamp.fromDate(new Date(newPlan.aiGeneratedAt))
          : newPlan.aiGeneratedAt
  }

  await setDoc(planRef, firestoreData)

  return newPlan
}

/**
 * Atualiza um plano terapêutico existente
 */
export async function updateTherapeuticPlan(
  patientId: string,
  planId: string,
  planData: Partial<TherapeuticPlanEntity>,
): Promise<void> {
  if (!patientId) {
    throw new Error('patientId é obrigatório')
  }

  if (!planId) {
    throw new Error('planId é obrigatório')
  }

  const planRef = doc(firestore, 'users', patientId, 'therapeuticPlans', planId)

  const updateData = {
    ...planData,
    updatedAt: Timestamp.fromDate(new Date()),
  }

  // Remove campos que não devem ser atualizados
  delete updateData.id
  delete updateData.createdAt

  await updateDoc(planRef, updateData)
}

/**
 * Dá alta ao paciente do plano terapêutico atual
 */
export async function dischargeTherapeuticPlan(
  patientId: string,
  planId: string,
  doctorId: string,
): Promise<TherapeuticPlanEntity> {
  if (!patientId || !planId || !doctorId) {
    throw new Error('patientId, planId e doctorId são obrigatórios')
  }

  const planRef = doc(firestore, 'users', patientId, 'therapeuticPlans', planId)
  const planDoc = await getDoc(planRef)

  if (!planDoc.exists()) {
    throw new Error('Plano terapêutico não encontrado')
  }

  const planData = planDoc.data()

  // Verificar se o plano já foi dado alta
  if (planData.dischargedAt) {
    throw new Error('Plano já foi dado alta anteriormente')
  }

  const now = new Date()
  const updateData = {
    dischargedAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  }

  await updateDoc(planRef, updateData)

  // Retornar plano atualizado
  const updatedPlanDoc = await getDoc(planRef)
  const updatedData = updatedPlanDoc.data()

  if (!updatedData) {
    throw new Error('Erro ao recuperar dados do plano atualizado')
  }

  return {
    id: updatedPlanDoc.id,
    patientId: updatedData.patientId,
    doctorId: updatedData.doctorId,
    objective: updatedData.objective,
    reevaluationPeriod: updatedData.reevaluationPeriod,
    reevaluationPeriodUnit: updatedData.reevaluationPeriodUnit,
    status: updatedData.status,
    createdBy: updatedData.createdBy,
    createdAt: updatedData.createdAt?.toDate
      ? updatedData.createdAt.toDate()
      : updatedData.createdAt,
    updatedAt: updatedData.updatedAt?.toDate
      ? updatedData.updatedAt.toDate()
      : updatedData.updatedAt,
    dischargedAt: updatedData.dischargedAt?.toDate
      ? updatedData.dischargedAt.toDate()
      : updatedData.dischargedAt,
    initialDefinitions: updatedData.initialDefinitions,
    diagnostics: updatedData.diagnostics,
    healthPillars: updatedData.healthPillars,
    consultationPlan: updatedData.consultationPlan,
    medications: updatedData.medications,
    aiGeneratedItems: updatedData.aiGeneratedItems,
    sourceCheckupId: updatedData.sourceCheckupId,
    aiGeneratedPlan: updatedData.aiGeneratedPlan,
    aiGeneratedAt: updatedData.aiGeneratedAt?.toDate
      ? updatedData.aiGeneratedAt.toDate()
      : updatedData.aiGeneratedAt,
  } as TherapeuticPlanEntity
}

/**
 * Busca um plano terapêutico específico
 */
export async function getTherapeuticPlanById(
  patientId: string,
  planId: string,
): Promise<TherapeuticPlanEntity | null> {
  if (!patientId || !planId) {
    return null
  }

  const planRef = doc(firestore, 'users', patientId, 'therapeuticPlans', planId)
  const planDoc = await getDoc(planRef)

  if (!planDoc.exists()) {
    return null
  }

  const data = planDoc.data()

  return {
    id: planDoc.id,
    patientId: data.patientId,
    doctorId: data.doctorId,
    objective: data.objective,
    reevaluationPeriod: data.reevaluationPeriod,
    reevaluationPeriodUnit: data.reevaluationPeriodUnit,
    status: data.status,
    createdBy: data.createdBy,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : data.createdAt,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : data.updatedAt,
    initialDefinitions: data.initialDefinitions,
    diagnostics: data.diagnostics,
    healthPillars: data.healthPillars,
    consultationPlan: data.consultationPlan,
    medications: data.medications,
    aiGeneratedItems: data.aiGeneratedItems,
    sourceCheckupId: data.sourceCheckupId,
    aiGeneratedPlan: data.aiGeneratedPlan,
    aiGeneratedAt: data.aiGeneratedAt?.toDate
      ? data.aiGeneratedAt.toDate()
      : data.aiGeneratedAt,
    dischargedAt: data.dischargedAt?.toDate
      ? data.dischargedAt.toDate()
      : data.dischargedAt,
  } as TherapeuticPlanEntity
}

/**
 * Busca todos os planos terapêuticos de um paciente
 */
export async function getAllTherapeuticPlansByPatient(
  patientId: string,
): Promise<TherapeuticPlanEntity[]> {
  if (!patientId) {
    return []
  }

  const plansRef = collection(firestore, 'users', patientId, 'therapeuticPlans')
  const q = query(plansRef, orderBy('createdAt', 'desc'))

  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return []
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      patientId: data.patientId,
      doctorId: data.doctorId,
      objective: data.objective,
      reevaluationPeriod: data.reevaluationPeriod,
      reevaluationPeriodUnit: data.reevaluationPeriodUnit,
      status: data.status,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
      initialDefinitions: data.initialDefinitions,
      diagnostics: data.diagnostics,
      healthPillars: data.healthPillars,
      consultationPlan: data.consultationPlan,
      medications: data.medications,
      aiGeneratedItems: data.aiGeneratedItems,
      sourceCheckupId: data.sourceCheckupId,
      aiGeneratedPlan: data.aiGeneratedPlan,
      aiGeneratedAt: data.aiGeneratedAt?.toDate
        ? data.aiGeneratedAt.toDate()
        : data.aiGeneratedAt,
      dischargedAt: data.dischargedAt?.toDate
        ? data.dischargedAt.toDate()
        : data.dischargedAt,
    } as TherapeuticPlanEntity
  })
}

/**
 * Adiciona IDs de medicamentos ao plano terapêutico
 */
export async function linkMedicationsToPlan(
  patientId: string,
  planId: string,
  medicationIds: string[],
): Promise<void> {
  if (!patientId || !planId) {
    throw new Error('patientId e planId são obrigatórios')
  }

  const planRef = doc(firestore, 'users', patientId, 'therapeuticPlans', planId)
  const planDoc = await getDoc(planRef)

  if (!planDoc.exists()) {
    throw new Error('Plano terapêutico não encontrado')
  }

  const currentData = planDoc.data()
  const currentMedications = (currentData.medications as
    | {
      medicationIds?: string[]
      lastUpdated?: Date
    }
    | undefined) || { medicationIds: [] }

  const existingIds = currentMedications.medicationIds || []
  const newIds = [...new Set([...existingIds, ...medicationIds])] // Remove duplicatas

  await updateDoc(planRef, {
    medications: {
      medicationIds: newIds,
      lastUpdated: Timestamp.fromDate(new Date()),
    },
    updatedAt: Timestamp.fromDate(new Date()),
  })
}

/**
 * Remove IDs de medicamentos do plano terapêutico
 */
export async function unlinkMedicationsFromPlan(
  patientId: string,
  planId: string,
  medicationIds: string[],
): Promise<void> {
  if (!patientId || !planId) {
    throw new Error('patientId e planId são obrigatórios')
  }

  const planRef = doc(firestore, 'users', patientId, 'therapeuticPlans', planId)
  const planDoc = await getDoc(planRef)

  if (!planDoc.exists()) {
    throw new Error('Plano terapêutico não encontrado')
  }

  const currentData = planDoc.data()
  const currentMedications = (currentData.medications as
    | {
      medicationIds?: string[]
      lastUpdated?: Date
    }
    | undefined) || { medicationIds: [] }

  const existingIds = currentMedications.medicationIds || []
  const newIds = existingIds.filter((id) => !medicationIds.includes(id))

  await updateDoc(planRef, {
    medications: {
      medicationIds: newIds,
      lastUpdated: Timestamp.fromDate(new Date()),
    },
    updatedAt: Timestamp.fromDate(new Date()),
  })
}
