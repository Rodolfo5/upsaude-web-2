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
import type { EmailNotificationEntity } from '@/types/entities/emailNotification'

const db = getFirestore(firebaseApp)
const COLLECTION_NAME = 'emailNotifications'

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
  } as EmailNotificationEntity
}

export interface UseUnreadNotificationsReturn {
  unreadCount: number
  loading: boolean
  notifications: EmailNotificationEntity[]
}

/**
 * Hook que escuta em tempo real as notificações não lidas do destinatário.
 * Usa onSnapshot do Firestore para atualização automática.
 */
export function useUnreadNotifications(
  recipientId: string | undefined,
): UseUnreadNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<EmailNotificationEntity[]>(
    [],
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!recipientId) {
      setUnreadCount(0)
      setNotifications([])
      setLoading(false)
      return
    }

    setLoading(true)
    const collectionRef = collection(db, COLLECTION_NAME)
    const q = query(
      collectionRef,
      where('recipientId', '==', recipientId),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc'),
      limit(100),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) =>
          parseNotificationDoc(docSnap.id, docSnap.data() as Record<string, unknown>),
        )
        setNotifications(items)
        setUnreadCount(snapshot.size)
        setLoading(false)
      },
      (error) => {
        console.error('❌ Erro ao buscar notificações não lidas:', error)
        console.error(
          '🔧 SOLUÇÃO: O Firestore precisa de um índice composto.',
        )
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
        setNotifications([])
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [recipientId])

  return { unreadCount, loading, notifications }
}
