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
import { DiagnosticEntity } from '@/types/entities/diagnostic'

const firestore = getFirestore(firebaseApp)

/**
 * Cria um novo diagnóstico na subcoleção do plano terapêutico
 * Estrutura: users/{patientId}/therapeuticPlans/{planId}/diagnostics/{diagnosticId}
 */
export async function createDiagnostic(
  patientId: string,
  planId: string,
  data: Partial<DiagnosticEntity>,
): Promise<DiagnosticEntity> {
  if (!patientId) {
    throw new Error('patientId é obrigatório')
  }

  if (!planId) {
    throw new Error('planId é obrigatório')
  }

  const diagnosticRef = doc(
    collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      planId,
      'diagnostics',
    ),
  )
  const diagnosticId = diagnosticRef.id

  const now = new Date()

  const newDiagnostic: DiagnosticEntity = {
    id: diagnosticId,
    name: data.name || '',
    cid: data.cid || '',
    category: data.category || 'Agudo',
    status: data.status || 'Ativo',
    registeredBy: data.registeredBy || '',
    doctorId: data.doctorId || '',
    registeredAt: now,
    createdAt: now,
    updatedAt: now,
    ...data,
  }

  await setDoc(diagnosticRef, {
    ...newDiagnostic,
    registeredAt: Timestamp.fromDate(now),
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  })

  return newDiagnostic
}

/**
 * Busca um diagnóstico específico
 */
export async function getDiagnosticById(
  patientId: string,
  planId: string,
  diagnosticId: string,
): Promise<DiagnosticEntity | null> {
  if (!patientId || !planId || !diagnosticId) {
    return null
  }

  const diagnosticRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'diagnostics',
    diagnosticId,
  )
  const diagnosticDoc = await getDoc(diagnosticRef)

  if (!diagnosticDoc.exists()) {
    return null
  }

  const data = diagnosticDoc.data()

  return {
    id: diagnosticDoc.id,
    name: data.name,
    cid: data.cid,
    category: data.category,
    status: data.status,
    registeredBy: data.registeredBy,
    doctorId: data.doctorId,
    registeredAt: data.registeredAt?.toDate
      ? data.registeredAt.toDate()
      : data.registeredAt,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : data.createdAt,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : data.updatedAt,
  } as DiagnosticEntity
}

/**
 * Busca todos os diagnósticos de um plano terapêutico
 */
export async function getAllDiagnosticsByPlan(
  patientId: string,
  planId: string,
): Promise<DiagnosticEntity[]> {
  if (!patientId || !planId) {
    return []
  }

  const diagnosticsRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'diagnostics',
  )
  const q = query(diagnosticsRef, orderBy('registeredAt', 'desc'))

  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return []
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name,
      cid: data.cid,
      category: data.category,
      status: data.status,
      registeredBy: data.registeredBy,
      doctorId: data.doctorId,
      registeredAt: data.registeredAt?.toDate
        ? data.registeredAt.toDate()
        : data.registeredAt,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
    } as DiagnosticEntity
  })
}

/**
 * Atualiza um diagnóstico existente
 */
export async function updateDiagnostic(
  patientId: string,
  planId: string,
  diagnosticId: string,
  data: Partial<DiagnosticEntity>,
): Promise<void> {
  if (!patientId) {
    throw new Error('patientId é obrigatório')
  }

  if (!planId) {
    throw new Error('planId é obrigatório')
  }

  if (!diagnosticId) {
    throw new Error('diagnosticId é obrigatório')
  }

  const diagnosticRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'diagnostics',
    diagnosticId,
  )

  const updateData = {
    ...data,
    updatedAt: Timestamp.fromDate(new Date()),
  }

  // Remove campos que não devem ser atualizados
  delete updateData.id
  delete updateData.createdAt
  delete updateData.registeredAt

  await updateDoc(diagnosticRef, updateData)
}

/**
 * Remove um diagnóstico
 */
export async function deleteDiagnostic(
  patientId: string,
  planId: string,
  diagnosticId: string,
): Promise<void> {
  if (!patientId) {
    throw new Error('patientId é obrigatório')
  }

  if (!planId) {
    throw new Error('planId é obrigatório')
  }

  if (!diagnosticId) {
    throw new Error('diagnosticId é obrigatório')
  }

  const diagnosticRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'diagnostics',
    diagnosticId,
  )

  await deleteDoc(diagnosticRef)
}
