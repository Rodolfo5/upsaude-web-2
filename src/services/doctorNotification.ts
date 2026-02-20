import { createFirestoreDoc } from '@/services/firebase/firestore'
import { DoctorNotificationEntity } from '@/types/entities/doctorNotification'

export type CreateDoctorNotificationInput = Omit<
  DoctorNotificationEntity,
  'id' | 'createdAt'
>

const COLLECTION_NAME = 'doctorNotifications'

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
