/**
 * API Route para obter detalhes de uma notificação por e-mail.
 *
 * GET /api/email-notifications/{id}
 */

import { doc, getDoc, getFirestore } from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import type { EmailNotificationEntity } from '@/types/entities/emailNotification'

const db = getFirestore(firebaseApp)
const COLLECTION_NAME = 'emailNotifications'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    if (!id) {
      return Response.json(
        { error: 'ID da notificação é obrigatório' },
        { status: 400 },
      )
    }

    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return Response.json(
        { error: 'Notificação não encontrada' },
        { status: 404 },
      )
    }

    const data = docSnap.data()
    const notification: EmailNotificationEntity & { id: string } = {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      sentAt: data.sentAt?.toDate ? data.sentAt.toDate() : data.sentAt,
    } as EmailNotificationEntity & { id: string }

    return Response.json({
      success: true,
      data: notification,
    })
  } catch (error) {
    console.error('Erro ao buscar notificação:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return Response.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
