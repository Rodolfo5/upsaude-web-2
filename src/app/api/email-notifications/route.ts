import { NextResponse } from 'next/server'

import {
  forbiddenRouteResponse,
  isAdminOrSameRouteUser,
  requireAuthenticatedRouteUser,
} from '@/lib/server/routeAuth'
import type { EmailNotificationEntity } from '@/types/entities/emailNotification'

const COLLECTION_NAME = 'emailNotifications'

export async function GET(request: Request) {
  try {
    const authResult = await requireAuthenticatedRouteUser(request)

    if ('response' in authResult) {
      return authResult.response
    }

    const { user, db } = authResult
    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipientId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (!recipientId) {
      return NextResponse.json(
        { error: 'recipientId e obrigatorio' },
        { status: 400 },
      )
    }

    if (!isAdminOrSameRouteUser(user, recipientId)) {
      return forbiddenRouteResponse(
        'Voce nao tem permissao para consultar estas notificacoes.',
      )
    }

    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where('recipientId', '==', recipientId)
      .orderBy('createdAt', 'desc')
      .get()

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

    return NextResponse.json({
      success: true,
      data: notifications,
      total: allDocs.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Erro ao buscar notificacoes:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
