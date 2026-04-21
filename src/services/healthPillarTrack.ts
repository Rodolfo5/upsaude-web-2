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
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import { TrackEntity } from '@/types/entities/healthPillar'

const firestore = getFirestore(firebaseApp)

/**
 * Cria uma nova trilha (opcionalmente associada a uma meta)
 * Estrutura: users/{patientId}/therapeuticPlans/{planId}/healthPillars/{pillarId}/tracks/{trackId}
 */
export async function createTrack(
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string | undefined,
  data: Partial<TrackEntity>,
): Promise<TrackEntity> {
  if (!patientId || !planId || !pillarId) {
    throw new Error('patientId, planId e pillarId são obrigatórios')
  }

  const trackRef = doc(
    collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      planId,
      'healthPillars',
      pillarId,
      'tracks',
    ),
  )
  const trackId = trackRef.id

  const now = new Date()

  const newTrack: TrackEntity = {
    id: trackId,
    pillarId,
    goalId: goalId || '',
    name: data.name || '',
    description: data.description,
    doctorId: data.doctorId || '',
    createdAt: now,
    updatedAt: now,
    ...data,
  }

  // Remover campos undefined antes de salvar no Firestore
  const trackData: any = {
    id: trackId,
    pillarId,
    goalId: goalId || '',
    name: newTrack.name,
    status: newTrack.status,
    doctorId: newTrack.doctorId,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  }

  if (newTrack.description !== undefined) {
    trackData.description = newTrack.description
  }
  if (newTrack.observations !== undefined) {
    trackData.observations = newTrack.observations
  }

  await setDoc(trackRef, trackData)

  return newTrack
}

/**
 * Busca uma trilha específica por ID
 */
export async function getTrackById(
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string | undefined,
  trackId: string,
): Promise<TrackEntity | null> {
  if (!patientId || !planId || !pillarId || !trackId) {
    return null
  }

  const trackRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'tracks',
    trackId,
  )

  const trackDoc = await getDoc(trackRef)

  if (!trackDoc.exists()) {
    return null
  }

  const data = trackDoc.data()
  const track: TrackEntity = {
    id: trackDoc.id,
    pillarId: data.pillarId,
    goalId: data.goalId,
    name: data.name || '',
    description: data.description,
    observations: data.observations,
    status: data.status || 'Não iniciado',
    doctorId: data.doctorId || data.createdBy || '', // Compatibilidade com dados antigos
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : data.createdAt || new Date(),
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : data.updatedAt || new Date(),
  }

  console.log('getTrackById retornou:', track)
  return track
}

/**
 * Busca todas as trilhas de um pilar
 */
export async function getAllTracksByPillar(
  patientId: string,
  planId: string,
  pillarId: string,
): Promise<TrackEntity[]> {
  if (!patientId || !planId || !pillarId) {
    return []
  }

  const tracksRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'tracks',
  )
  const q = query(tracksRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return []
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      pillarId: data.pillarId,
      goalId: data.goalId,
      name: data.name,
      description: data.description,
      doctorId: data.doctorId || data.createdBy || '', // Compatibilidade com dados antigos
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
    } as TrackEntity
  })
}

/**
 * Busca todas as trilhas de uma meta
 */
export async function getAllTracksByGoal(
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string,
): Promise<TrackEntity[]> {
  if (!patientId || !planId || !pillarId || !goalId) {
    return []
  }

  const tracksRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'tracks',
  )
  const q = query(
    tracksRef,
    where('goalId', '==', goalId),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return []
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      pillarId: data.pillarId,
      goalId: data.goalId,
      name: data.name,
      description: data.description,
      observations: data.observations,
      status: data.status,
      doctorId: data.doctorId || data.createdBy || '', // Compatibilidade com dados antigos
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
    } as TrackEntity
  })
}

/**
 * Atualiza uma trilha existente
 */
export async function updateTrack(
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string | undefined,
  trackId: string,
  data: Partial<TrackEntity>,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !trackId) {
    throw new Error('patientId, planId, pillarId e trackId são obrigatórios')
  }

  const trackRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'tracks',
    trackId,
  )

  // Remover campos undefined antes de atualizar no Firestore
  const updateData: any = {
    updatedAt: Timestamp.fromDate(new Date()),
  }

  if (data.name !== undefined) {
    updateData.name = data.name
  }
  if (data.description !== undefined) {
    updateData.description = data.description
  }
  if (data.observations !== undefined) {
    updateData.observations = data.observations
  }
  if (data.status !== undefined) {
    updateData.status = data.status
  }
  if (data.doctorId !== undefined) {
    updateData.doctorId = data.doctorId
  }

  await updateDoc(trackRef, updateData)
}

/**
 * Remove uma trilha
 */
export async function deleteTrack(
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string,
  trackId: string,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !goalId || !trackId) {
    throw new Error('Todos os IDs são obrigatórios')
  }

  const trackRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'tracks',
    trackId,
  )

  await deleteDoc(trackRef)
}
