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
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import { LifestyleCategoryEntity } from '@/types/entities/healthPillar'

const firestore = getFirestore(firebaseApp)

export async function createLifestyleCategory(
  patientId: string,
  planId: string,
  pillarId: string,
  data: Partial<LifestyleCategoryEntity>,
): Promise<LifestyleCategoryEntity> {
  if (!patientId || !planId || !pillarId) {
    throw new Error('patientId, planId e pillarId são obrigatórios')
  }

  const existingCategories = await getAllCategoriesByPillar(
    patientId,
    planId,
    pillarId,
  )
  const categoryExists = existingCategories.some((c) => c.type === data.type)
  if (categoryExists) {
    throw new Error(`Categoria do tipo "${data.type}" já existe`)
  }

  const categoryRef = doc(
    collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      planId,
      'healthPillars',
      pillarId,
      'categories',
    ),
  )
  const categoryId = categoryRef.id

  const now = new Date()

  const newCategory: LifestyleCategoryEntity = {
    id: categoryId,
    pillarId,
    type: data.type!,
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

  const categoryData: any = {
    id: categoryId,
    pillarId,
    type: newCategory.type,
    status: newCategory.status,
    doctorId: newCategory.doctorId,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  }

  if (newCategory.desiredParameter !== undefined) {
    categoryData.desiredParameter = newCategory.desiredParameter
  }
  if (newCategory.aiGenerated !== undefined) {
    categoryData.aiGenerated = newCategory.aiGenerated
  }
  if (newCategory.aiGeneratedAt !== undefined) {
    categoryData.aiGeneratedAt =
      newCategory.aiGeneratedAt instanceof Date
        ? Timestamp.fromDate(newCategory.aiGeneratedAt)
        : typeof newCategory.aiGeneratedAt === 'string'
          ? Timestamp.fromDate(new Date(newCategory.aiGeneratedAt))
          : newCategory.aiGeneratedAt
  }
  if (newCategory.aiModel !== undefined) {
    categoryData.aiModel = newCategory.aiModel
  }
  if (newCategory.approvalStatus !== undefined) {
    categoryData.approvalStatus = newCategory.approvalStatus
  }

  await setDoc(categoryRef, categoryData)

  return newCategory
}

export async function getCategoryById(
  patientId: string,
  planId: string,
  pillarId: string,
  categoryId: string,
): Promise<LifestyleCategoryEntity | null> {
  if (!patientId || !planId || !pillarId || !categoryId) {
    return null
  }

  const categoryRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'categories',
    categoryId,
  )
  const categoryDoc = await getDoc(categoryRef)

  if (!categoryDoc.exists()) {
    return null
  }

  const data = categoryDoc.data()

  return {
    id: categoryDoc.id,
    pillarId: data.pillarId,
    type: data.type,
    status: data.status,
    desiredParameter: data.desiredParameter,
    doctorId: data.doctorId || '',
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
  } as LifestyleCategoryEntity
}

export async function getCategoryByType(
  patientId: string,
  planId: string,
  pillarId: string,
  type: string,
): Promise<LifestyleCategoryEntity | null> {
  if (!patientId || !planId || !pillarId || !type) {
    return null
  }

  const categoriesRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'categories',
  )
  const q = query(categoriesRef, where('type', '==', type))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  const data = doc.data()

  return {
    id: doc.id,
    pillarId: data.pillarId,
    type: data.type,
    status: data.status,
    desiredParameter: data.desiredParameter,
    doctorId: data.doctorId || '',
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
  } as LifestyleCategoryEntity
}

export async function getAllCategoriesByPillar(
  patientId: string,
  planId: string,
  pillarId: string,
): Promise<LifestyleCategoryEntity[]> {
  if (!patientId || !planId || !pillarId) {
    return []
  }

  const categoriesRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'categories',
  )
  const q = query(categoriesRef, orderBy('createdAt', 'desc'))
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
      status: data.status,
      desiredParameter: data.desiredParameter,
      doctorId: data.doctorId || '',
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
    } as LifestyleCategoryEntity
  })
}

export async function updateCategory(
  patientId: string,
  planId: string,
  pillarId: string,
  categoryId: string,
  data: Partial<LifestyleCategoryEntity>,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !categoryId) {
    throw new Error('Todos os IDs são obrigatórios')
  }

  const categoryRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'categories',
    categoryId,
  )

  const updateData: any = {
    updatedAt: Timestamp.fromDate(new Date()),
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

  await updateDoc(categoryRef, updateData)
}

export async function deleteCategory(
  patientId: string,
  planId: string,
  pillarId: string,
  categoryId: string,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !categoryId) {
    throw new Error('Todos os IDs são obrigatórios')
  }

  const categoryRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'categories',
    categoryId,
  )

  await deleteDoc(categoryRef)
}
