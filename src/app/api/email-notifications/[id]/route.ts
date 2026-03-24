import { NextResponse } from 'next/server'

import {
  forbiddenRouteResponse,
  isAdminOrSameRouteUser,
  requireAuthenticatedRouteUser,
} from '@/lib/server/routeAuth'
import type { EmailNotificationEntity } from '@/types/entities/emailNotification'

const COLLECTION_NAME = 'emailNotifications'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuthenticatedRouteUser(request)

    if ('response' in authResult) {
      return authResult.response
    }

    const { user, db } = authResult
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID da notificacao e obrigatorio' },
        { status: 400 },
      )
    }

    const docSnap = await db.collection(COLLECTION_NAME).doc(id).get()

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Notificacao nao encontrada' },
        { status: 404 },
      )
    }

    const data = docSnap.data()

    if (!isAdminOrSameRouteUser(user, data?.recipientId)) {
      return forbiddenRouteResponse(
        'Voce nao tem permissao para consultar esta notificacao.',
      )
    }

    const notification: EmailNotificationEntity & { id: string } = {
      id: docSnap.id,
      ...data,
      createdAt: data?.createdAt?.toDate
        ? data.createdAt.toDate()
        : data?.createdAt,
      sentAt: data?.sentAt?.toDate ? data.sentAt.toDate() : data?.sentAt,
    } as EmailNotificationEntity & { id: string }

    return NextResponse.json({
      success: true,
      data: notification,
    })
  } catch (error) {
    console.error('Erro ao buscar notificacao:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
