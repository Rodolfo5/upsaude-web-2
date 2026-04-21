/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  collection,
  deleteDoc,
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

import firebaseApp from '@/config/firebase/app'
import { GoalEntity } from '@/types/entities/healthPillar'

const firestore = getFirestore(firebaseApp)

/**
 * Cria uma nova meta na subcoleção do pilar
 * Estrutura: users/{patientId}/therapeuticPlans/{planId}/healthPillars/{pillarId}/goals/{goalId}
 */
export async function createGoal(
  patientId: string,
  planId: string,
  pillarId: string,
  data: Partial<GoalEntity>,
): Promise<GoalEntity> {
  if (!patientId || !planId || !pillarId) {
    throw new Error('patientId, planId e pillarId são obrigatórios')
  }

  // Para Saúde Mental, verificar se já existe meta do mesmo tipo (exceto 'Outros')
  if (data.type && data.type !== 'Outros') {
    const existingGoals = await getAllGoalsByPillar(patientId, planId, pillarId)
    const goalExists = existingGoals.some((g) => g.type === data.type)
    if (goalExists) {
      throw new Error(`Meta do tipo "${data.type}" já existe`)
    }
  }

  const goalRef = doc(
    collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      planId,
      'healthPillars',
      pillarId,
      'goals',
    ),
  )
  const goalId = goalRef.id

  const now = new Date()

  const newGoal: GoalEntity = {
    id: goalId,
    pillarId,
    type: data.type,
    name: data.name,
    customTitle: data.customTitle,
    status: data.status || 'Ativa',
    desiredParameter: data.desiredParameter,
    doctorId: data.doctorId || '',
    createdAt: now,
    updatedAt: now,
    aiGenerated: data.aiGenerated,
    aiGeneratedAt: data.aiGeneratedAt,
    aiModel: data.aiModel,
    approvalStatus: data.approvalStatus,
  }

  // Remover campos undefined antes de salvar no Firestore
  const goalData: any = {
    id: goalId,
    pillarId,
    status: newGoal.status,
    doctorId: newGoal.doctorId,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  }

  if (newGoal.type !== undefined) {
    goalData.type = newGoal.type
  }
  if (newGoal.name !== undefined) {
    goalData.name = newGoal.name
  }
  if (newGoal.customTitle !== undefined) {
    goalData.customTitle = newGoal.customTitle
  }
  if (newGoal.desiredParameter !== undefined) {
    goalData.desiredParameter = newGoal.desiredParameter
  }
  if (newGoal.aiGenerated !== undefined) {
    goalData.aiGenerated = newGoal.aiGenerated
  }
  if (newGoal.aiGeneratedAt !== undefined) {
    goalData.aiGeneratedAt =
      newGoal.aiGeneratedAt instanceof Date
        ? Timestamp.fromDate(newGoal.aiGeneratedAt)
        : typeof newGoal.aiGeneratedAt === 'string'
          ? Timestamp.fromDate(new Date(newGoal.aiGeneratedAt))
          : newGoal.aiGeneratedAt
  }
  if (newGoal.aiModel !== undefined) {
    goalData.aiModel = newGoal.aiModel
  }
  if (newGoal.approvalStatus !== undefined) {
    goalData.approvalStatus = newGoal.approvalStatus
  }

  await setDoc(goalRef, goalData)

  return newGoal
}

/**
 * Busca uma meta específica
 */
export async function getGoalById(
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string,
): Promise<GoalEntity | null> {
  if (!patientId || !planId || !pillarId || !goalId) {
    return null
  }

  const goalRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'goals',
    goalId,
  )
  const goalDoc = await getDoc(goalRef)

  if (!goalDoc.exists()) {
    return null
  }

  const data = goalDoc.data()

  return {
    id: goalDoc.id,
    pillarId: data.pillarId,
    type: data.type,
    name: data.name,
    customTitle: data.customTitle,
    status: data.status,
    desiredParameter: data.desiredParameter,
    doctorId: data.doctorId || data.createdBy || '', // Compatibilidade com dados antigos
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : data.createdAt,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : data.updatedAt,
    aiGenerated: data.aiGenerated,
    aiGeneratedAt: data.aiGeneratedAt?.toDate
      ? data.aiGeneratedAt.toDate()
      : data.aiGeneratedAt,
    aiModel: data.aiModel,
    approvalStatus: data.approvalStatus,
  } as GoalEntity
}

/**
 * Busca todas as metas de um pilar
 */
export async function getAllGoalsByPillar(
  patientId: string,
  planId: string,
  pillarId: string,
): Promise<GoalEntity[]> {
  if (!patientId || !planId || !pillarId) {
    return []
  }

  const goalsRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'goals',
  )
  const q = query(goalsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return []
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      pillarId: data.pillarId,
      type: data.type,
      name: data.name,
      customTitle: data.customTitle,
      status: data.status,
      desiredParameter: data.desiredParameter,
      doctorId: data.doctorId || data.createdBy || '', // Compatibilidade com dados antigos
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
      aiGenerated: data.aiGenerated,
      aiGeneratedAt: data.aiGeneratedAt?.toDate
        ? data.aiGeneratedAt.toDate()
        : data.aiGeneratedAt,
      aiModel: data.aiModel,
      approvalStatus: data.approvalStatus,
    } as GoalEntity
  })
}

/**
 * Atualiza uma meta existente
 */
export async function updateGoal(
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string,
  data: Partial<GoalEntity>,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !goalId) {
    throw new Error('Todos os IDs são obrigatórios')
  }

  const goalRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'goals',
    goalId,
  )

  // Remover campos undefined antes de atualizar no Firestore
  const updateData: any = {
    updatedAt: Timestamp.fromDate(new Date()),
  }

  if (data.type !== undefined) {
    updateData.type = data.type
  }
  if (data.name !== undefined) {
    updateData.name = data.name
  }
  if (data.customTitle !== undefined) {
    updateData.customTitle = data.customTitle
  }
  if (data.status !== undefined) {
    updateData.status = data.status
  }
  if (data.desiredParameter !== undefined) {
    updateData.desiredParameter = data.desiredParameter
  }
  if (data.doctorId !== undefined) {
    updateData.doctorId = data.doctorId
  }
  if (data.aiGenerated !== undefined) {
    updateData.aiGenerated = data.aiGenerated
  }
  if (data.aiGeneratedAt !== undefined) {
    updateData.aiGeneratedAt =
      data.aiGeneratedAt instanceof Date
        ? Timestamp.fromDate(data.aiGeneratedAt)
        : typeof data.aiGeneratedAt === 'string'
          ? Timestamp.fromDate(new Date(data.aiGeneratedAt))
          : data.aiGeneratedAt
  }
  if (data.aiModel !== undefined) {
    updateData.aiModel = data.aiModel
  }
  if (data.approvalStatus !== undefined) {
    updateData.approvalStatus = data.approvalStatus
  }

  await updateDoc(goalRef, updateData)
}

/**
 * Remove uma meta
 */
export async function deleteGoal(
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !goalId) {
    throw new Error('Todos os IDs são obrigatórios')
  }

  const goalRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'goals',
    goalId,
  )

  await deleteDoc(goalRef)
}
