import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  getDocs,
  getFirestore,
  DocumentData,
  Timestamp,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import type { TimelinePatientEntity } from '@/types/entities/timelinePatient'

const firestore = getFirestore(firebaseApp)

/**
 * Cria um novo timeline patient na subcoleção do usuário
 */
export async function createTimelinePatient(
  userId: string,
  data: Partial<TimelinePatientEntity>,
): Promise<TimelinePatientEntity> {
  if (!userId) {
    throw new Error('User ID is required')
  }

  const timelineRef = doc(
    collection(firestore, 'users', userId, 'timelinePatients'),
  )
  const timelineId = timelineRef.id

  const now = new Date()
  const timelineData: TimelinePatientEntity = {
    id: timelineId,
    patientId: data.patientId || userId,
    createdAt: Timestamp.fromDate(now),
    title: data.title || '',
    createdBy: data.createdBy || 'System',
    type: data.type || 'Outros',
  } as TimelinePatientEntity

  await setDoc(timelineRef, timelineData)
  return {
    ...timelineData,
    createdAt: Timestamp.fromDate(now),
  }
}

/**
 * Busca um timeline patient específico por ID
 */
export async function findTimelinePatientById(
  userId: string,
  timelineId: string,
): Promise<TimelinePatientEntity | null> {
  if (!userId || !timelineId) {
    return null
  }

  const timelineRef = doc(
    firestore,
    'users',
    userId,
    'timelinePatients',
    timelineId,
  )
  const timelineDoc = await getDoc(timelineRef)

  if (!timelineDoc.exists()) {
    return null
  }

  const data = timelineDoc.data() as DocumentData
  return {
    id: timelineDoc.id,
    patientId: data.patientId,
    createdAt: data.createdAt,
    title: data.title,
    createdBy: data.createdBy,
    type: data.type,
  } as TimelinePatientEntity
}

/**
 * Busca todos os timeline patients de um usuário
 */
export async function findAllTimelinePatients(
  userId: string,
): Promise<TimelinePatientEntity[]> {
  if (!userId) {
    return []
  }

  const timelineRef = collection(firestore, 'users', userId, 'timelinePatients')
  const q = query(timelineRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return []
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data() as DocumentData
    return {
      id: doc.id,
      patientId: data.patientId,
      createdAt: data.createdAt,
      title: data.title,
      createdBy: data.createdBy,
      type: data.type,
    } as TimelinePatientEntity
  })
}

/**
 * Atualiza um timeline patient existente
 */
export async function updateTimelinePatient(
  userId: string,
  timelineId: string,
  data: Partial<TimelinePatientEntity>,
): Promise<void> {
  if (!userId || !timelineId) {
    throw new Error('User ID and Timeline ID are required')
  }

  const timelineRef = doc(
    firestore,
    'users',
    userId,
    'timelinePatients',
    timelineId,
  )

  const updateData: Partial<TimelinePatientEntity> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.createdBy !== undefined) updateData.createdBy = data.createdBy
  if (data.type !== undefined) updateData.type = data.type

  await updateDoc(timelineRef, updateData)
}

/**
 * Deleta um timeline patient
 */
export async function deleteTimelinePatient(
  userId: string,
  timelineId: string,
): Promise<void> {
  if (!userId || !timelineId) {
    throw new Error('User ID and Timeline ID are required')
  }

  const timelineRef = doc(
    firestore,
    'users',
    userId,
    'timelinePatients',
    timelineId,
  )

  await deleteDoc(timelineRef)
}

/**
 * Cria múltiplas timeline patients para vários pacientes de uma vez
 * Útil quando uma ação afeta múltiplos pacientes (ex: aplicação de questionário)
 */
export async function createTimelinePatientsForQuestionnaire(
  patientIds: string[],
  data: Omit<TimelinePatientEntity, 'id' | 'createdAt' | 'patientId'>,
): Promise<TimelinePatientEntity[]> {
  if (!patientIds || patientIds.length === 0) {
    throw new Error('At least one patient ID is required')
  }

  if (!data.title) {
    throw new Error('title is required in data')
  }

  if (!data.createdBy) {
    throw new Error('createdBy is required in data')
  }

  if (!data.type) {
    throw new Error('type is required in data')
  }

  const now = new Date()
  const timestamp = Timestamp.fromDate(now)

  // Criar todas as timelines em paralelo
  const timelinePromises = patientIds.map(async (patientId) => {
    const timelineRef = doc(
      collection(firestore, 'users', patientId, 'timelinePatients'),
    )
    const timelineId = timelineRef.id

    const timelineData: TimelinePatientEntity = {
      id: timelineId,
      patientId,
      createdAt: timestamp,
      title: data.title,
      createdBy: data.createdBy,
      type: data.type,
    }

    await setDoc(timelineRef, timelineData)
    return {
      ...timelineData,
      createdAt: timestamp,
    }
  })

  return Promise.all(timelinePromises)
}
