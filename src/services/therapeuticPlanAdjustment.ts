import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import { TherapeuticPlanAdjustmentEntity } from '@/types/entities/therapeuticPlanAdjustment'

import { notifyPlanAlteredByOtherDoctor } from './emailNotification'

const firestore = getFirestore(firebaseApp)

/**
 * Cria um novo registro de ajuste terapêutico
 */
export async function createAdjustment(
  patientId: string,
  planId: string,
  data: {
    adjustmentType: string
    title: string
    doctorId: string
    doctorName: string
  },
): Promise<TherapeuticPlanAdjustmentEntity> {
  if (!patientId || !planId) {
    throw new Error('patientId e planId são obrigatórios')
  }

  const adjustmentRef = doc(
    collection(firestore, 'users', patientId, 'therapeuticPlanAdjustments'),
  )
  const adjustmentId = adjustmentRef.id

  const now = new Date()

  const newAdjustment: TherapeuticPlanAdjustmentEntity = {
    id: adjustmentId,
    patientId,
    planId,
    adjustmentType: data.adjustmentType,
    title: data.title,
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    createdAt: now,
  }

  const firestoreData = {
    ...newAdjustment,
    createdAt: Timestamp.fromDate(now),
  }

  await setDoc(adjustmentRef, firestoreData)

  const planRef = doc(firestore, 'users', patientId, 'therapeuticPlans', planId)
  const planDoc = await getDoc(planRef)
  const planDoctorId = planDoc.exists() ? planDoc.data()?.doctorId : null

  if (planDoctorId && planDoctorId !== data.doctorId) {
    notifyPlanAlteredByOtherDoctor(
      [planDoctorId],
      planId,
      data.doctorId,
      data.doctorName,
      patientId,
      false,
    ).catch((err: unknown) =>
      console.error('Erro ao enviar notificação de alteração de plano:', err),
    )
  }

  return newAdjustment
}

/**
 * Busca ajustes terapêuticos de um paciente com paginação
 */
export async function getAdjustmentsByPatient(
  patientId: string,
  pageSize: number = 3,
  lastDoc?: QueryDocumentSnapshot,
): Promise<{
  adjustments: TherapeuticPlanAdjustmentEntity[]
  lastDoc: QueryDocumentSnapshot | null
  hasMore: boolean
}> {
  if (!patientId) {
    return {
      adjustments: [],
      lastDoc: null,
      hasMore: false,
    }
  }

  const adjustmentsRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlanAdjustments',
  )

  let q = query(
    adjustmentsRef,
    orderBy('createdAt', 'desc'),
    limit(pageSize + 1), // Buscar um a mais para verificar se há mais páginas
  )

  if (lastDoc) {
    q = query(
      adjustmentsRef,
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize + 1),
    )
  }

  const snapshot = await getDocs(q)
  const docs = snapshot.docs

  const hasMore = docs.length > pageSize
  const adjustmentsDocs = hasMore ? docs.slice(0, pageSize) : docs

  const adjustments: TherapeuticPlanAdjustmentEntity[] = adjustmentsDocs.map(
    (doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        patientId: data.patientId,
        planId: data.planId,
        adjustmentType: data.adjustmentType,
        title: data.title,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt,
      } as TherapeuticPlanAdjustmentEntity
    },
  )

  return {
    adjustments,
    lastDoc:
      adjustmentsDocs.length > 0
        ? adjustmentsDocs[adjustmentsDocs.length - 1]
        : null,
    hasMore,
  }
}

/**
 * Conta o total de ajustes de um paciente
 */
export async function getAdjustmentCount(patientId: string): Promise<number> {
  if (!patientId) {
    return 0
  }

  const adjustmentsRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlanAdjustments',
  )

  const snapshot = await getDocs(adjustmentsRef)
  return snapshot.size
}
