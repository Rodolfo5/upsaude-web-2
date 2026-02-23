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
import { useCallback, useEffect, useMemo, useState } from 'react'

import firebaseApp from '@/config/firebase/firebase'
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/services/doctorNotification'
import type { DoctorNotificationEntity } from '@/types/entities/doctorNotification'

const db = getFirestore(firebaseApp)
const COLLECTION_NAME = 'doctorNotifications'

export type NotificationsFilter = 'all' | 'unread' | 'read'

function parseNotificationDoc(
  id: string,
  data: Record<string, unknown>,
): DoctorNotificationEntity {
  return {
    id,
    ...data,
    createdAt:
      (data.createdAt as { toDate?: () => Date })?.toDate?.() ??
      (data.createdAt as Date),
    hasSeenToUsers: (data.hasSeenToUsers as string[]) ?? [],
    users: (data.users as string[]) ?? [],
  } as DoctorNotificationEntity
}

export interface UseNotificationsReturn {
  notifications: DoctorNotificationEntity[]
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
    DoctorNotificationEntity[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<NotificationsFilter>('all')

  useEffect(() => {
    if (!recipientId || !enabled) {
      setAllNotifications((prev) => (prev.length === 0 ? prev : []))
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    const collectionRef = collection(db, COLLECTION_NAME)
    const q = query(
      collectionRef,
      where('users', 'array-contains', recipientId),
      orderBy('createdAt', 'desc'),
      limit(100),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) =>
          parseNotificationDoc(
            docSnap.id,
            docSnap.data() as Record<string, unknown>,
          ),
        )
        setAllNotifications(items)
        setLoading(false)
      },
      (err) => {
        console.error('❌ Erro ao buscar notificações:', err)
        console.error(
          '🔧 O Firestore precisa de um índice. Veja FIRESTORE_INDEX_FIX.md para resolver.',
        )
        const errorMessage =
          err instanceof Error ? err.message : 'Erro desconhecido'
        if (errorMessage.includes('index')) {
          setError('INDEX_REQUIRED')
        } else {
          setError(errorMessage)
        }
        setAllNotifications((prev) => (prev.length === 0 ? prev : []))
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [recipientId, enabled])

  const notifications = useMemo(
    () =>
      allNotifications.filter((n) => {
        const isRead = n.hasSeenToUsers.includes(recipientId ?? '')
        if (filter === 'all') return true
        if (filter === 'unread') return !isRead
        return isRead
      }),
    [allNotifications, filter, recipientId],
  )

  const markAsRead = useCallback(
    async (id: string) => {
      if (!recipientId) return
      await markNotificationAsRead(id, recipientId)
    },
    [recipientId],
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
