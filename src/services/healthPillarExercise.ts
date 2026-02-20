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

import firebaseApp from '@/config/firebase/firebase'
import { ExerciseEntity } from '@/types/entities/healthPillar'

const firestore = getFirestore(firebaseApp)

export async function createExercise(
  patientId: string,
  planId: string,
  pillarId: string,
  trackId: string,
  data: Partial<ExerciseEntity>,
): Promise<ExerciseEntity> {
  if (!patientId || !planId || !pillarId || !trackId) {
    throw new Error('Todos os IDs são obrigatórios')
  }

  const exerciseRef = doc(
    collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      planId,
      'healthPillars',
      pillarId,
      'tracks',
      trackId,
      'exercises',
    ),
  )
  const exerciseId = exerciseRef.id

  const now = new Date()

  const newExercise: ExerciseEntity = {
    id: exerciseId,
    trackId,
    type: data.type!,
    name: data.name || '',
    description: data.description,
    order: data.order,
    doctorId: data.doctorId || '',
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
    ...data,
  }

  const exerciseData: any = {
    id: exerciseId,
    trackId,
    type: newExercise.type,
    name: newExercise.name,
    doctorId: newExercise.doctorId,
    isCompleted: newExercise.isCompleted,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  }

  if (newExercise.description !== undefined) {
    exerciseData.description = newExercise.description
  }
  if (newExercise.order !== undefined) {
    exerciseData.order = newExercise.order
  }

  await setDoc(exerciseRef, exerciseData)

  return newExercise
}

export async function getExerciseById(
  patientId: string,
  planId: string,
  pillarId: string,
  trackId: string,
  exerciseId: string,
): Promise<ExerciseEntity | null> {
  if (!patientId || !planId || !pillarId || !trackId || !exerciseId) {
    return null
  }

  const exerciseRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'tracks',
    trackId,
    'exercises',
    exerciseId,
  )

  const exerciseDoc = await getDoc(exerciseRef)

  if (!exerciseDoc.exists()) {
    return null
  }

  const data = exerciseDoc.data()
  const exercise: ExerciseEntity = {
    id: exerciseDoc.id,
    trackId: data.trackId,
    type: data.type,
    name: data.name || '',
    description: data.description,
    order: data.order,
    doctorId: data.doctorId || '',
    isCompleted: data.isCompleted ?? false,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : data.createdAt || new Date(),
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : data.updatedAt || new Date(),
  }

  return exercise
}

export async function getAllExercisesByTrack(
  patientId: string,
  planId: string,
  pillarId: string,
  trackId: string,
): Promise<ExerciseEntity[]> {
  if (!patientId || !planId || !pillarId || !trackId) {
    return []
  }

  const exercisesRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'tracks',
    trackId,
    'exercises',
  )
  const q = query(exercisesRef, orderBy('order', 'asc'))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return []
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      trackId: data.trackId,
      type: data.type,
      name: data.name,
      description: data.description,
      order: data.order,
      doctorId: data.doctorId,
      isCompleted: data.isCompleted ?? false,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
    } as ExerciseEntity
  })
}

export async function updateExercise(
  patientId: string,
  planId: string,
  pillarId: string,
  trackId: string,
  exerciseId: string,
  data: Partial<ExerciseEntity>,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !trackId || !exerciseId) {
    throw new Error('Todos os IDs são obrigatórios')
  }

  const exerciseRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'tracks',
    trackId,
    'exercises',
    exerciseId,
  )

  const updateData: any = {
    updatedAt: Timestamp.fromDate(new Date()),
  }

  if (data.type !== undefined) {
    updateData.type = data.type
  }
  if (data.name !== undefined) {
    updateData.name = data.name
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
  if (data.isCompleted !== undefined) {
    updateData.isCompleted = data.isCompleted
  }

  await updateDoc(exerciseRef, updateData)
}

export async function deleteExercise(
  patientId: string,
  planId: string,
  pillarId: string,
  trackId: string,
  exerciseId: string,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !trackId || !exerciseId) {
    throw new Error('Todos os IDs são obrigatórios')
  }

  const exerciseRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'tracks',
    trackId,
    'exercises',
    exerciseId,
  )

  await deleteDoc(exerciseRef)
}
