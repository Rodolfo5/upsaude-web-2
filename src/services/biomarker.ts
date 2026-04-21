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
  updateDoc,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import { BiomarkerEntity } from '@/types/entities/biomarker'

const firestore = getFirestore(firebaseApp)

/**
 * Cria um novo biomarcador na subcoleção do pilar
 * Estrutura: users/{patientId}/therapeuticPlans/{planId}/healthPillars/{pillarId}/biomarkers/{biomarkerId}
 */
export async function createBiomarker(
  patientId: string,
  planId: string,
  pillarId: string,
  data: Partial<BiomarkerEntity>,
): Promise<BiomarkerEntity> {
  if (!patientId || !planId || !pillarId) {
    throw new Error('patientId, planId e pillarId são obrigatórios')
  }

  const biomarkerRef = doc(
    collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      planId,
      'healthPillars',
      pillarId,
      'biomarkers',
    ),
  )
  const biomarkerId = biomarkerRef.id

  const now = new Date()

  const newBiomarker: BiomarkerEntity = {
    id: biomarkerId,
    pillarId,
    type: data.type || 'bloodGlucose',
    minValue: data.minValue || '',
    maxValue: data.maxValue || '',
    status: data.status || 'pending',
    createdBy: data.createdBy || 'IA',
    editedBy: data.editedBy,
    createdAt: now,
    updatedAt: now,
  }

  // Remover campos undefined antes de salvar no Firestore
  const biomarkerData: Partial<BiomarkerEntity> = {
    id: biomarkerId,
    pillarId,
    type: newBiomarker.type,
    minValue: newBiomarker.minValue,
    maxValue: newBiomarker.maxValue,
    status: newBiomarker.status,
    createdBy: newBiomarker.createdBy,
    createdAt: now,
    updatedAt: now,
  }

  if (newBiomarker.editedBy !== undefined) {
    biomarkerData.editedBy = newBiomarker.editedBy
  }

  await setDoc(biomarkerRef, biomarkerData)

  return newBiomarker
}

/**
 * Busca um biomarcador específico
 */
export async function getBiomarkerById(
  patientId: string,
  planId: string,
  pillarId: string,
  biomarkerId: string,
): Promise<BiomarkerEntity | null> {
  if (!patientId || !planId || !pillarId || !biomarkerId) {
    return null
  }

  const biomarkerRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'biomarkers',
    biomarkerId,
  )
  const biomarkerDoc = await getDoc(biomarkerRef)

  if (!biomarkerDoc.exists()) {
    return null
  }

  const data = biomarkerDoc.data()

  return {
    id: biomarkerDoc.id,
    pillarId: data.pillarId,
    type: data.type,
    minValue: data.minValue,
    maxValue: data.maxValue,
    status: data.status,
    createdBy: data.createdBy,
    editedBy: data.editedBy,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : data.createdAt,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : data.updatedAt,
  } as BiomarkerEntity
}

/**
 * Busca todos os biomarcadores de um pilar
 */
export async function getAllBiomarkersByPillar(
  patientId: string,
  planId: string,
  pillarId: string,
): Promise<BiomarkerEntity[]> {
  if (!patientId || !planId || !pillarId) {
    return []
  }

  const biomarkersRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'biomarkers',
  )
  const q = query(biomarkersRef, orderBy('createdAt', 'desc'))
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
      minValue: data.minValue,
      maxValue: data.maxValue,
      status: data.status,
      createdBy: data.createdBy,
      editedBy: data.editedBy,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
    } as BiomarkerEntity
  })
}

/**
 * Atualiza um biomarcador existente
 */
export async function updateBiomarker(
  patientId: string,
  planId: string,
  pillarId: string,
  biomarkerId: string,
  data: Partial<BiomarkerEntity>,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !biomarkerId) {
    throw new Error('Todos os IDs são obrigatórios')
  }

  const biomarkerRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'biomarkers',
    biomarkerId,
  )

  // Remover campos undefined antes de atualizar no Firestore
  const updateData: Partial<BiomarkerEntity> = {
    updatedAt: new Date(),
  }

  if (data.type !== undefined) {
    updateData.type = data.type
  }
  if (data.minValue !== undefined) {
    updateData.minValue = data.minValue
  }
  if (data.maxValue !== undefined) {
    updateData.maxValue = data.maxValue
  }
  if (data.status !== undefined) {
    updateData.status = data.status
  }
  if (data.createdBy !== undefined) {
    updateData.createdBy = data.createdBy
  }
  if (data.editedBy !== undefined) {
    updateData.editedBy = data.editedBy
  }

  await updateDoc(biomarkerRef, updateData)
}

/**
 * Remove um biomarcador
 */
export async function deleteBiomarker(
  patientId: string,
  planId: string,
  pillarId: string,
  biomarkerId: string,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !biomarkerId) {
    throw new Error('Todos os IDs são obrigatórios')
  }

  const biomarkerRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'biomarkers',
    biomarkerId,
  )

  await deleteDoc(biomarkerRef)
}
