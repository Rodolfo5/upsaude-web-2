import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createSendPulseClient } from '@/lib/sendpulse'
import {
  forbiddenRouteResponse,
  isAdminOrSameRouteUser,
  requireAuthenticatedRouteUser,
} from '@/lib/server/routeAuth'
import { getNotificationTemplate } from '@/services/emailNotification/templates'
import {
  EmailNotificationEntity,
  EmailNotificationStatus,
} from '@/types/entities/emailNotification'

const COLLECTION_NAME = 'emailNotifications'

const retrySchema = z.object({
  notificationId: z.string().min(1, 'notificationId e obrigatorio'),
})

export async function POST(request: Request) {
  try {
    const authResult = await requireAuthenticatedRouteUser(request)

    if ('response' in authResult) {
      return authResult.response
    }

    const { user, db } = authResult
    const parsedBody = retrySchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'notificationId e obrigatorio' },
        { status: 400 },
      )
    }

    const { notificationId } = parsedBody.data
    const docRef = db.collection(COLLECTION_NAME).doc(notificationId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Notificacao nao encontrada' },
        { status: 404 },
      )
    }

    const notificationData = docSnap.data() as EmailNotificationEntity

    if (!isAdminOrSameRouteUser(user, notificationData.recipientId)) {
      return forbiddenRouteResponse(
        'Voce nao tem permissao para reenviar esta notificacao.',
      )
    }

    if (notificationData.status !== EmailNotificationStatus.FAILED) {
      return NextResponse.json(
        {
          error: 'Apenas notificacoes com status "failed" podem ser reenviadas',
          currentStatus: notificationData.status,
        },
        { status: 400 },
      )
    }

    await docRef.update({
      status: EmailNotificationStatus.PENDING,
      error: null,
    })

    const htmlContent = getNotificationTemplate(
      notificationData.eventType,
      notificationData.title,
      notificationData.message,
      notificationData.metadata || {},
    )

    try {
      const client = createSendPulseClient()
      await client.sendEmail({
        to: [
          {
            email: notificationData.recipientEmail,
            name: notificationData.recipientName,
          },
        ],
        subject: notificationData.title,
        html: htmlContent,
      })

      await docRef.update({
        status: EmailNotificationStatus.SENT,
        error: null,
        sentAt: new Date(),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar'

      await docRef.update({
        status: EmailNotificationStatus.FAILED,
        error: message,
      })

      return NextResponse.json(
        { success: false, error: message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notificacao reenviada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao reenviar notificacao:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
