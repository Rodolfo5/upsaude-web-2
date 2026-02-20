import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import { HealthPillarEntity, HealthPillarType } from '@/types/entities/healthPillar'

const firestore = getFirestore(firebaseApp)

/**
 * Cria um novo pilar de saúde se não existir
 * Estrutura: users/{patientId}/therapeuticPlans/{planId}/healthPillars/{pillarId}
 */
export async function createHealthPillar(
  patientId: string,
  planId: string,
  type: HealthPillarType,
): Promise<HealthPillarEntity> {
  if (!patientId) {
    throw new Error('patientId é obrigatório')
  }

  if (!planId) {
    throw new Error('planId é obrigatório')
  }

  // Verificar se já existe pilar deste tipo
  const existingPillar = await getHealthPillar(patientId, planId, type)
  if (existingPillar) {
    return existingPillar
  }

  const pillarRef = doc(
    collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      planId,
      'healthPillars',
    ),
  )
  const pillarId = pillarRef.id

  const now = new Date()

  const newPillar: HealthPillarEntity = {
    id: pillarId,
    patientId,
    planId,
    type,
    createdAt: now,
    updatedAt: now,
  }

  await setDoc(pillarRef, {
    ...newPillar,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  })

  return newPillar
}

/**
 * Busca um pilar específico por tipo
 */
export async function getHealthPillar(
  patientId: string,
  planId: string,
  type: HealthPillarType,
): Promise<HealthPillarEntity | null> {
  if (!patientId || !planId) {
    return null
  }

  const pillarsRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
  )
  const q = query(pillarsRef, where('type', '==', type))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  const data = doc.data()

  return {
    id: doc.id,
    patientId: data.patientId,
    planId: data.planId,
    type: data.type,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : data.createdAt,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : data.updatedAt,
  } as HealthPillarEntity
}

/**
 * Busca todos os pilares de um plano
 */
export async function getAllHealthPillars(
  patientId: string,
  planId: string,
): Promise<HealthPillarEntity[]> {
  if (!patientId || !planId) {
    return []
  }

  const pillarsRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
  )
  const snapshot = await getDocs(pillarsRef)

  if (snapshot.empty) {
    return []
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      patientId: data.patientId,
      planId: data.planId,
      type: data.type,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
    } as HealthPillarEntity
  })
}

