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
import { useEffect, useState } from 'react'

import firebaseApp from '@/config/firebase/firebase'
import type { DoctorNotificationEntity } from '@/types/entities/doctorNotification'

const db = getFirestore(firebaseApp)
const COLLECTION_NAME = 'doctorNotifications'

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

export interface UseUnreadNotificationsReturn {
  unreadCount: number
  loading: boolean
  notifications: DoctorNotificationEntity[]
}

/**
 * Hook que escuta em tempo real as notificações não lidas do destinatário.
 * Usa onSnapshot do Firestore para atualização automática.
 */
export function useUnreadNotifications(
  recipientId: string | undefined,
): UseUnreadNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<
    DoctorNotificationEntity[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!recipientId) {
      setUnreadCount(0)
      setNotifications((prev) => (prev.length === 0 ? prev : []))
      setLoading(false)
      return
    }

    setLoading(true)
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
        const unreadItems = items.filter(
          (item) => !item.hasSeenToUsers.includes(recipientId),
        )
        setNotifications(unreadItems)
        setUnreadCount(unreadItems.length)
        setLoading(false)
      },
      (error) => {
        console.error('❌ Erro ao buscar notificações não lidas:', error)
        console.error('🔧 SOLUÇÃO: O Firestore precisa de um índice composto.')
        console.error(
          '📝 Clique no link que aparece acima no erro para criar o índice automaticamente.',
        )
        console.error(
          '⏱️  Após criar, aguarde 2-5 minutos e recarregue a página.',
        )
        console.error(
          '📚 Mais informações: Veja o arquivo FIRESTORE_INDEX_FIX.md na raiz do projeto.',
        )
        setUnreadCount(0)
        setNotifications((prev) => (prev.length === 0 ? prev : []))
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [recipientId])

  return { unreadCount, loading, notifications }
}
