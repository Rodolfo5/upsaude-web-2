/**
 * API Route para consulta de histórico de notificações por e-mail.
 *
 * GET /api/email-notifications?recipientId={doctorId}
 * GET /api/email-notifications?recipientId={doctorId}&limit=50&offset=0
 */

import {
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import type { EmailNotificationEntity } from '@/types/entities/emailNotification'

const db = getFirestore(firebaseApp)
const COLLECTION_NAME = 'emailNotifications'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipientId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (!recipientId) {
      return Response.json(
        { error: 'recipientId é obrigatório' },
        { status: 400 },
      )
    }

    const notificationsRef = collection(db, COLLECTION_NAME)
    const q = query(
      notificationsRef,
      where('recipientId', '==', recipientId),
      orderBy('createdAt', 'desc'),
    )

    const snapshot = await getDocs(q)
    const allDocs = snapshot.docs

    const notifications: (EmailNotificationEntity & { id: string })[] = allDocs
      .slice(offset, offset + limit)
      .map((docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt,
          sentAt: data.sentAt?.toDate ? data.sentAt.toDate() : data.sentAt,
        } as EmailNotificationEntity & { id: string }
      })

    return Response.json({
      success: true,
      data: notifications,
      total: allDocs.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return Response.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
