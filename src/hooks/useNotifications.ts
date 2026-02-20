'use client'

import {
  collection,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'

import firebaseApp from '@/config/firebase/firebase'
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/services/emailNotification/emailNotification'
import type { EmailNotificationEntity } from '@/types/entities/emailNotification'

const db = getFirestore(firebaseApp)
const COLLECTION_NAME = 'emailNotifications'

export type NotificationsFilter = 'all' | 'unread' | 'read'

function parseNotificationDoc(
  id: string,
  data: Record<string, unknown>,
): EmailNotificationEntity {
  return {
    id,
    ...data,
    createdAt:
      (data.createdAt as { toDate?: () => Date })?.toDate?.() ??
      (data.createdAt as Date),
    sentAt:
      (data.sentAt as { toDate?: () => Date })?.toDate?.() ??
      (data.sentAt as Date | null) ??
      null,
    readAt:
      (data.readAt as { toDate?: () => Date })?.toDate?.() ??
      (data.readAt as Date | null) ??
      null,
    isRead: data.isRead === true,
  } as EmailNotificationEntity
}

export interface UseNotificationsReturn {
  notifications: EmailNotificationEntity[]
  loading: boolean
  error: string | null
  filter: NotificationsFilter
  setFilter: (filter: NotificationsFilter) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

/**
 * Hook para o modal de notificações.
 * Escuta todas as notificações do destinatário e permite filtrar (todas, não lidas, lidas).
 */
export function useNotifications(
  recipientId: string | undefined,
  enabled: boolean,
): UseNotificationsReturn {
  const [allNotifications, setAllNotifications] = useState<
    EmailNotificationEntity[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<NotificationsFilter>('all')

  useEffect(() => {
    if (!recipientId || !enabled) {
      setAllNotifications([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    const collectionRef = collection(db, COLLECTION_NAME)
    const q = query(
      collectionRef,
      where('recipientId', '==', recipientId),
      orderBy('createdAt', 'desc'),
      limit(100),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) =>
          parseNotificationDoc(docSnap.id, docSnap.data() as Record<string, unknown>),
        )
        setAllNotifications(items)
        setLoading(false)
      },
      (err) => {
        console.error('❌ Erro ao buscar notificações:', err)
        console.error(
          '🔧 O Firestore precisa de um índice. Veja FIRESTORE_INDEX_FIX.md para resolver.',
        )
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        if (errorMessage.includes('index')) {
          setError('INDEX_REQUIRED')
        } else {
          setError(errorMessage)
        }
        setAllNotifications([])
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [recipientId, enabled])

  const notifications = allNotifications.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.isRead
    return n.isRead
  })

  const markAsRead = useCallback(
    async (id: string) => {
      await markNotificationAsRead(id)
    },
    [],
  )

  const markAllAsRead = useCallback(async () => {
    if (!recipientId) return
    await markAllNotificationsAsRead(recipientId)
  }, [recipientId])

  return {
    notifications,
    loading,
    error,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
  }
}
