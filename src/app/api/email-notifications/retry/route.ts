/**
 * API Route para reenviar notificação falhada.
 *
 * POST /api/email-notifications/retry
 * Body: { notificationId: string }
 */

import { doc, getDoc, getFirestore } from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import {
  sendEmailNotification,
  updateNotificationStatus,
} from '@/services/emailNotification'
import { getNotificationTemplate } from '@/services/emailNotification/templates'
import { EmailNotificationStatus } from '@/types/entities/emailNotification'

const db = getFirestore(firebaseApp)
const COLLECTION_NAME = 'emailNotifications'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return Response.json(
        { error: 'notificationId é obrigatório' },
        { status: 400 },
      )
    }

    const docRef = doc(db, COLLECTION_NAME, notificationId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return Response.json(
        { error: 'Notificação não encontrada' },
        { status: 404 },
      )
    }

    const notificationData = docSnap.data()

    if (notificationData.status !== EmailNotificationStatus.FAILED) {
      return Response.json(
        {
          error: 'Apenas notificações com status "failed" podem ser reenviadas',
          currentStatus: notificationData.status,
        },
        { status: 400 },
      )
    }

    await updateNotificationStatus(
      notificationId,
      EmailNotificationStatus.PENDING,
      null,
    )

    const htmlContent = getNotificationTemplate(
      notificationData.eventType,
      notificationData.title,
      notificationData.message,
      notificationData.metadata || {},
    )

    const { success, error } = await sendEmailNotification(
      notificationId,
      htmlContent,
    )

    if (!success) {
      return Response.json(
        { success: false, error: error || 'Falha ao reenviar' },
        { status: 500 },
      )
    }

    return Response.json({
      success: true,
      message: 'Notificação reenviada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao reenviar notificação:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return Response.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
