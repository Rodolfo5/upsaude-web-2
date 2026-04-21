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
import { OrientationEntity } from '@/types/entities/healthPillar'

const firestore = getFirestore(firebaseApp)

/**
 * Cria uma nova orientação associada a uma meta
 * Estrutura: users/{patientId}/therapeuticPlans/{planId}/healthPillars/{pillarId}/orientations/{orientationId}
 */
export async function createOrientation(
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string,
  isRead: boolean,
  data: Partial<OrientationEntity>,
): Promise<OrientationEntity> {
  if (!patientId || !planId || !pillarId) {
    throw new Error('patientId, planId e pillarId são obrigatórios')
  }
  // goalId pode ser vazio para Estilo de Vida quando usar área

  const orientationRef = doc(
    collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      planId,
      'healthPillars',
      pillarId,
      'orientations',
    ),
  )
  const orientationId = orientationRef.id

  const now = new Date()

  const newOrientation: OrientationEntity = {
    id: orientationId,
    pillarId,
    goalId,
    title: data.title || '',
    description: data.description,
    status: data.status || 'Ativa',
    doctorId: data.doctorId || '',
    isRead,
    createdAt: now,
    updatedAt: now,
    aiGenerated: data.aiGenerated,
    aiGeneratedAt: data.aiGeneratedAt,
    aiModel: data.aiModel,
    approvalStatus: data.approvalStatus,
    ...data,
  }

  // Remover campos undefined antes de salvar no Firestore
  const orientationData: any = {
    id: orientationId,
    pillarId,
    goalId: goalId || '',
    title: newOrientation.title,
    status: newOrientation.status,
    doctorId: newOrientation.doctorId,
    isRead: false,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  }

  if (newOrientation.description !== undefined) {
    orientationData.description = newOrientation.description
  }
  if (newOrientation.supportMaterial !== undefined) {
    orientationData.supportMaterial = newOrientation.supportMaterial
  }
  if (newOrientation.area !== undefined) {
    orientationData.area = newOrientation.area
  }
  if (newOrientation.aiGenerated !== undefined) {
    orientationData.aiGenerated = newOrientation.aiGenerated
  }
  if (newOrientation.aiGeneratedAt !== undefined) {
    orientationData.aiGeneratedAt =
      newOrientation.aiGeneratedAt instanceof Date
        ? Timestamp.fromDate(newOrientation.aiGeneratedAt)
        : typeof newOrientation.aiGeneratedAt === 'string'
          ? Timestamp.fromDate(new Date(newOrientation.aiGeneratedAt))
          : newOrientation.aiGeneratedAt
  }
  if (newOrientation.aiModel !== undefined) {
    orientationData.aiModel = newOrientation.aiModel
  }
  if (newOrientation.approvalStatus !== undefined) {
    orientationData.approvalStatus = newOrientation.approvalStatus
  }
  if (newOrientation.menuData !== undefined) {
    orientationData.menuData = newOrientation.menuData
  }
  if (newOrientation.tags !== undefined) {
    orientationData.tags = newOrientation.tags
  }

  await setDoc(orientationRef, orientationData)

  return newOrientation
}

/**
 * Busca todas as orientações de um pilar
 */
export async function getAllOrientationsByPillar(
  patientId: string,
  planId: string,
  pillarId: string,
): Promise<OrientationEntity[]> {
  if (!patientId || !planId || !pillarId) {
    return []
  }

  const orientationsRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'orientations',
  )
  const q = query(orientationsRef, orderBy('createdAt', 'desc'))
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
      area: data.area,
      title: data.title,
      description: data.description,
      supportMaterial: data.supportMaterial,
      status: data.status || 'Ativa',
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
      menuData: data.menuData,
      tags: data.tags,
      isRead: data.isRead || false,
    } as OrientationEntity
  })
}

/**
 * Busca uma orientação específica por ID
 */
export async function getOrientationById(
  patientId: string,
  planId: string,
  pillarId: string,
  orientationId: string,
): Promise<OrientationEntity | null> {
  if (!patientId || !planId || !pillarId || !orientationId) {
    return null
  }

  const orientationRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'orientations',
    orientationId,
  )
  const docSnap = await getDoc(orientationRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data()
  return {
    id: docSnap.id,
    pillarId: data.pillarId,
    goalId: data.goalId,
    area: data.area,
    title: data.title,
    description: data.description,
    supportMaterial: data.supportMaterial,
    status: data.status || 'Ativa',
    doctorId: data.doctorId || data.createdBy || '',
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
    menuData: data.menuData,
    tags: data.tags,
    isRead: data.isRead || false,
  } as OrientationEntity
}

/**
 * Busca todas as orientações de uma meta
 */
export async function getAllOrientationsByGoal(
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string,
): Promise<OrientationEntity[]> {
  if (!patientId || !planId || !pillarId || !goalId) {
    return []
  }

  const orientationsRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'orientations',
  )
  const q = query(
    orientationsRef,
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
      area: data.area,
      title: data.title,
      description: data.description,
      supportMaterial: data.supportMaterial,
      status: data.status || 'Ativa',
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
      menuData: data.menuData,
      tags: data.tags,
      isRead: data.isRead || false,
    } as OrientationEntity
  })
}

/**
 * Atualiza uma orientação existente
 */
export async function updateOrientation(
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string,
  orientationId: string,
  data: Partial<OrientationEntity>,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !orientationId) {
    throw new Error(
      'patientId, planId, pillarId e orientationId são obrigatórios',
    )
  }

  const orientationRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'orientations',
    orientationId,
  )

  // Remover campos undefined antes de atualizar no Firestore
  const updateData: any = {
    updatedAt: Timestamp.fromDate(new Date()),
  }

  if (data.title !== undefined) {
    updateData.title = data.title
  }
  if (data.description !== undefined) {
    updateData.description = data.description
  }
  if (data.supportMaterial !== undefined) {
    updateData.supportMaterial = data.supportMaterial
  }
  if (data.status !== undefined) {
    updateData.status = data.status
  }
  if (data.area !== undefined) {
    updateData.area = data.area
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
  if (data.menuData !== undefined) {
    updateData.menuData = data.menuData
  }
  if (data.tags !== undefined) {
    updateData.tags = data.tags
  }

  await updateDoc(orientationRef, updateData)
}

/**
 * Remove uma orientação
 */
export async function deleteOrientation(
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string,
  orientationId: string,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !orientationId) {
    throw new Error(
      'patientId, planId, pillarId e orientationId são obrigatórios',
    )
  }

  const orientationRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'orientations',
    orientationId,
  )

  await deleteDoc(orientationRef)
}
