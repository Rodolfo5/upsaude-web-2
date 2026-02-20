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
import { MenuEntity } from '@/types/entities/healthPillar'

const firestore = getFirestore(firebaseApp)

/**
 * Cria um novo cardápio na subcoleção menu
 * Estrutura: users/{patientId}/therapeuticPlans/{planId}/healthPillars/{pillarId}/menu/{menuId}
 */
export async function createMenu(
  patientId: string,
  planId: string,
  pillarId: string,
  data: Partial<MenuEntity>,
): Promise<MenuEntity> {
  if (!patientId || !planId || !pillarId) {
    throw new Error('patientId, planId e pillarId são obrigatórios')
  }

  const menuRef = doc(
    collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      planId,
      'healthPillars',
      pillarId,
      'menu',
    ),
  )
  const menuId = menuRef.id

  const now = new Date()

  const newMenu: MenuEntity = {
    id: menuId,
    pillarId,
    title: data.title || '',
    description: data.description,
    status: data.status || 'Ativa',
    doctorId: data.doctorId || '',
    createdAt: now,
    updatedAt: now,
    menuData: data.menuData,
    tags: data.tags,
  }

  // Remover campos undefined antes de salvar no Firestore
  const menuData: any = {
    id: menuId,
    pillarId,
    title: newMenu.title,
    status: newMenu.status,
    doctorId: newMenu.doctorId,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  }

  if (newMenu.description !== undefined) {
    menuData.description = newMenu.description
  }
  if (newMenu.menuData !== undefined) {
    menuData.menuData = newMenu.menuData
  }
  if (newMenu.tags !== undefined) {
    menuData.tags = newMenu.tags
  }

  await setDoc(menuRef, menuData)

  return newMenu
}

/**
 * Busca todos os cardápios de um pilar
 */
export async function getAllMenusByPillar(
  patientId: string,
  planId: string,
  pillarId: string,
): Promise<MenuEntity[]> {
  if (!patientId || !planId || !pillarId) {
    return []
  }

  const menusRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'menu',
  )
  const q = query(menusRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return []
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      pillarId: data.pillarId,
      title: data.title,
      description: data.description,
      status: data.status || 'Ativa',
      doctorId: data.doctorId || '',
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
      menuData: data.menuData,
      tags: data.tags,
    } as MenuEntity
  })
}

/**
 * Busca um cardápio específico por ID
 */
export async function getMenuById(
  patientId: string,
  planId: string,
  pillarId: string,
  menuId: string,
): Promise<MenuEntity | null> {
  if (!patientId || !planId || !pillarId || !menuId) {
    return null
  }

  const menuRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'menu',
    menuId,
  )
  const docSnap = await getDoc(menuRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data()
  return {
    id: docSnap.id,
    pillarId: data.pillarId,
    title: data.title,
    description: data.description,
    status: data.status || 'Ativa',
    doctorId: data.doctorId || '',
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : data.createdAt,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : data.updatedAt,
    menuData: data.menuData,
    tags: data.tags,
  } as MenuEntity
}

/**
 * Atualiza um cardápio existente
 */
export async function updateMenu(
  patientId: string,
  planId: string,
  pillarId: string,
  menuId: string,
  data: Partial<MenuEntity>,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !menuId) {
    throw new Error('patientId, planId, pillarId e menuId são obrigatórios')
  }

  const menuRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'menu',
    menuId,
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
  if (data.status !== undefined) {
    updateData.status = data.status
  }
  if (data.doctorId !== undefined) {
    updateData.doctorId = data.doctorId
  }
  if (data.menuData !== undefined) {
    updateData.menuData = data.menuData
  }
  if (data.tags !== undefined) {
    updateData.tags = data.tags
  }

  await updateDoc(menuRef, updateData)
}

/**
 * Remove um cardápio
 */
export async function deleteMenu(
  patientId: string,
  planId: string,
  pillarId: string,
  menuId: string,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !menuId) {
    throw new Error('patientId, planId, pillarId e menuId são obrigatórios')
  }

  const menuRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'menu',
    menuId,
  )

  await deleteDoc(menuRef)
}
