import { NotificationEntity } from '@/types/entities/notification'

import { createFirestoreDoc } from '../firebase/firestore'

export const createNotificationDoc = (
  notification: Omit<NotificationEntity, 'id'>,
) =>
  createFirestoreDoc({
    collectionPath: '/notifications',
    data: notification,
  })

export const sendNotification = async (
  data: Omit<NotificationEntity, 'id' | 'createdAt'>,
) => {
  await fetch('/api/notifications', {
    method: 'POST',
    body: JSON.stringify({
      type: data.type,
      title: data.title,
      content: data.content,
      date: data.date ?? null,
      users: data.users,
      status: data.status,
      hasSeenToUsers: data.hasSeenToUsers,
    }),
  })
}
