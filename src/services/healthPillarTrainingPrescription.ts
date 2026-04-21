/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import { TrainingPrescriptionEntity } from '@/types/entities/healthPillar'

const firestore = getFirestore(firebaseApp)

export async function createTrainingPrescription(
  patientId: string,
  planId: string,
  pillarId: string,
  activityId: string,
  data: Partial<TrainingPrescriptionEntity>,
): Promise<TrainingPrescriptionEntity> {
  if (!patientId || !planId || !pillarId || !activityId) {
    throw new Error('patientId, planId, pillarId e activityId são obrigatórios')
  }

  const prescriptionRef = doc(
    collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      planId,
      'healthPillars',
      pillarId,
      'activities',
      activityId,
      'trainingPrescriptions',
    ),
  )
  const prescriptionId = prescriptionRef.id

  const now = new Date()

  const newPrescription: TrainingPrescriptionEntity = {
    id: prescriptionId,
    activityId,
    title: data.title || '',
    description: data.description || '',
    order: data.order,
    doctorId: data.doctorId || '',
    createdAt: now,
    updatedAt: now,
  }

  const prescriptionData: any = {
    id: prescriptionId,
    activityId,
    title: newPrescription.title,
    description: newPrescription.description,
    doctorId: newPrescription.doctorId,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  }

  if (newPrescription.order !== undefined) {
    prescriptionData.order = newPrescription.order
  }

  await setDoc(prescriptionRef, prescriptionData)

  return newPrescription
}

/**
 * Busca todas as prescrições de treino de uma atividade
 */
export async function getTrainingPrescriptionsByActivityId(
  patientId: string,
  planId: string,
  pillarId: string,
  activityId: string,
): Promise<TrainingPrescriptionEntity[]> {
  if (!patientId || !planId || !pillarId || !activityId) {
    return []
  }

  const prescriptionsRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'activities',
    activityId,
    'trainingPrescriptions',
  )
  const q = query(prescriptionsRef, orderBy('order', 'asc'))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return []
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      activityId: data.activityId,
      title: data.title,
      description: data.description,
      order: data.order,
      doctorId: data.doctorId,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
    } as TrainingPrescriptionEntity
  })
}

/**
 * Atualiza uma prescrição de treino existente
 */
export async function updateTrainingPrescription(
  patientId: string,
  planId: string,
  pillarId: string,
  activityId: string,
  prescriptionId: string,
  data: Partial<TrainingPrescriptionEntity>,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !activityId || !prescriptionId) {
    throw new Error('Todos os IDs são obrigatórios')
  }

  const prescriptionRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'activities',
    activityId,
    'trainingPrescriptions',
    prescriptionId,
  )

  const updateData: any = {
    updatedAt: Timestamp.fromDate(new Date()),
  }

  if (data.title !== undefined) {
    updateData.title = data.title
  }
  if (data.description !== undefined) {
    updateData.description = data.description
  }
  if (data.order !== undefined) {
    updateData.order = data.order
  }
  if (data.doctorId !== undefined) {
    updateData.doctorId = data.doctorId
  }

  await updateDoc(prescriptionRef, updateData)
}

/**
 * Remove uma prescrição de treino
 */
export async function deleteTrainingPrescription(
  patientId: string,
  planId: string,
  pillarId: string,
  activityId: string,
  prescriptionId: string,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !activityId || !prescriptionId) {
    throw new Error('Todos os IDs são obrigatórios')
  }

  const prescriptionRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'activities',
    activityId,
    'trainingPrescriptions',
    prescriptionId,
  )

  await deleteDoc(prescriptionRef)
}
