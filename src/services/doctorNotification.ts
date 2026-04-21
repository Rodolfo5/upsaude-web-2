import {
  arrayUnion,
  collection,
  doc,
  FieldValue,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import { createFirestoreDoc } from '@/services/firebase/firestore'
import { DoctorNotificationEntity } from '@/types/entities/doctorNotification'

export type CreateDoctorNotificationInput = Omit<
  DoctorNotificationEntity,
  'id' | 'createdAt'
>

const COLLECTION_NAME = 'doctorNotifications'
const db = getFirestore(firebaseApp)

export const createDoctorNotificationDoc = (
  data: Omit<DoctorNotificationEntity, 'id'>,
) =>
  createFirestoreDoc<DoctorNotificationEntity>({
    collectionPath: COLLECTION_NAME,
    data,
  })

export const createDoctorNotification = async (
  data: CreateDoctorNotificationInput,
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await createDoctorNotificationDoc({
    ...data,
    status: data.status ?? '',
    hasSeenToUsers: data.hasSeenToUsers ?? [],
    createdAt: new Date(),
  })
  if (error) {
    return { success: false, error }
  }
  return { success: true }
}

/**
 * Marca uma notificação como lida para um usuário específico.
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
): Promise<{ error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, notificationId)
    await updateDoc(docRef, {
      hasSeenToUsers: arrayUnion(userId),
    } as { [x: string]: FieldValue | Partial<unknown> })
    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return { error: message }
  }
}

/**
 * Marca todas as notificações do usuário como lidas.
 */
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<{ error: string | null }> {
  try {
    const collectionRef = collection(db, COLLECTION_NAME)
    const q = query(collectionRef, where('users', 'array-contains', userId))
    const snapshot = await getDocs(q)

    await Promise.all(
      snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as DoctorNotificationEntity
        if (!data.hasSeenToUsers.includes(userId)) {
          return updateDoc(docSnap.ref, {
            hasSeenToUsers: arrayUnion(userId),
          } as { [x: string]: FieldValue | Partial<unknown> })
        }
        return Promise.resolve()
      }),
    )
    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return { error: message }
  }
}
