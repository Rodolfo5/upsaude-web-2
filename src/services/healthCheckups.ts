import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  getDocs,
  getFirestore,
  DocumentData,
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import type {
  HealthCheckupEntity,
  CheckupStatus,
} from '@/types/entities/healthCheckup'

import { findDoctorById } from './doctor'

interface HealthCheckupWithDoctor extends HealthCheckupEntity {
  doctor?: {
    name?: string
    typeOfCredential?: string
    credential?: string
    state?: string
  }
}

const firestore = getFirestore(firebaseApp)

/**
 * Cria um novo health checkup na subcoleção do usuário
 */
export async function createHealthCheckup(
  userId: string,
  data: Partial<HealthCheckupEntity>,
): Promise<HealthCheckupEntity> {
  const checkupRef = doc(
    collection(firestore, 'users', userId, 'healthCheckups'),
  )
  const checkupId = checkupRef.id

  const checkupData: HealthCheckupEntity = {
    id: checkupId,
    userId,
    status: data.status || 'IN_PROGRESS',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  } as HealthCheckupEntity

  await setDoc(checkupRef, checkupData)
  return checkupData
}

/**
 * Atualiza um health checkup existente
 */
export async function updateHealthCheckup(
  userId: string,
  checkupId: string,
  data: Partial<HealthCheckupEntity>,
): Promise<void> {
  const checkupRef = doc(
    firestore,
    'users',
    userId,
    'healthCheckups',
    checkupId,
  )
  await updateDoc(checkupRef, {
    ...data,
    updatedAt: new Date(),
  })
}

/**
 * Busca um health checkup específico
 */
export async function findHealthCheckupById(
  userId: string,
  checkupId: string,
): Promise<HealthCheckupWithDoctor | null> {
  const checkupRef = doc(
    firestore,
    'users',
    userId,
    'healthCheckups',
    checkupId,
  )
  const snap = await getDoc(checkupRef)

  if (!snap.exists()) return null

  const data = snap.data() as DocumentData
  const checkup = {
    ...data,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : data.createdAt,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : data.updatedAt,
    completedAt: data.completedAt?.toDate
      ? data.completedAt.toDate()
      : data.completedAt,
  } as HealthCheckupWithDoctor

  // Buscar dados do doctor se doctorId existir
  if (checkup.doctorId) {
    try {
      const doctor = await findDoctorById(checkup.doctorId)
      if (doctor) {
        checkup.doctor = {
          name: doctor.name,
          typeOfCredential: doctor.typeOfCredential,
          credential: doctor.credential,
          state: doctor.state,
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do doctor:', error)
    }
  }

  return checkup
}

/**
 * Busca o último health checkup do usuário
 */
export async function findLatestHealthCheckup(
  userId: string,
): Promise<HealthCheckupEntity | null> {
  const checkupsRef = collection(firestore, 'users', userId, 'healthCheckups')
  const q = query(checkupsRef, orderBy('createdAt', 'desc'), limit(1))
  const snapshot = await getDocs(q)

  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  const data = doc.data() as DocumentData

  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : data.createdAt,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : data.updatedAt,
    completedAt: data.completedAt?.toDate
      ? data.completedAt.toDate()
      : data.completedAt,
  } as HealthCheckupEntity
}

/**
 * Busca o último health checkup COMPLETED do usuário
 */
export async function findLatestCompletedHealthCheckup(
  userId: string,
): Promise<HealthCheckupEntity | null> {
  const checkupsRef = collection(firestore, 'users', userId, 'healthCheckups')
  const q = query(
    checkupsRef,
    where('status', '==', 'COMPLETED'),
    orderBy('completedAt', 'desc'),
    limit(1),
  )
  const snapshot = await getDocs(q)

  if (snapshot.empty) return null

  const docSnap = snapshot.docs[0]
  const data = docSnap.data() as DocumentData

  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : data.createdAt,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : data.updatedAt,
    completedAt: data.completedAt?.toDate
      ? data.completedAt.toDate()
      : data.completedAt,
  } as HealthCheckupEntity
}

/**
 * Marca um health checkup como completo
 */
export async function completeHealthCheckup(
  userId: string,
  checkupId: string,
): Promise<void> {
  const checkupRef = doc(
    firestore,
    'users',
    userId,
    'healthCheckups',
    checkupId,
  )
  await updateDoc(checkupRef, {
    status: 'COMPLETED' as CheckupStatus,
    completedAt: new Date(),
    updatedAt: new Date(),
  })
}

/**
 * Busca todos os health checkups do paciente
 */
export async function findAllHealthCheckups(
  userId: string,
): Promise<HealthCheckupWithDoctor[]> {
  const checkupsRef = collection(firestore, 'users', userId, 'healthCheckups')
  const q = query(checkupsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)

  if (snapshot.empty) return []

  const checkups = snapshot.docs.map((doc) => {
    const data = doc.data() as DocumentData
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
      completedAt: data.completedAt?.toDate
        ? data.completedAt.toDate()
        : data.completedAt,
    } as HealthCheckupWithDoctor
  })

  // Coletar doctorIds únicos
  const doctorIds = [
    ...new Set(checkups.map((c) => c.doctorId).filter(Boolean)),
  ]

  // Buscar doctors
  const doctors = await Promise.all(
    doctorIds.map(async (id) => {
      try {
        const doctor = await findDoctorById(id!)
        return doctor
      } catch (error) {
        console.error(`Error fetching doctor with ID ${id}:`, error)
        return null
      }
    }),
  )
  const doctorMap = new Map(doctors.filter((d) => d).map((d) => [d!.id, d!]))

  // Adicionar doctor aos checkups
  return checkups.map((checkup) => ({
    ...checkup,
    doctor: checkup.doctorId
      ? {
          name: doctorMap.get(checkup.doctorId)?.name,
          typeOfCredential: doctorMap.get(checkup.doctorId)?.typeOfCredential,
          credential: doctorMap.get(checkup.doctorId)?.credential,
          state: doctorMap.get(checkup.doctorId)?.state,
        }
      : undefined,
  }))
}
