import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  forbiddenRouteResponse,
  hasRouteUserRole,
  requireAuthenticatedRouteUser,
} from '@/lib/server/routeAuth'
import { EmailService } from '@/services/email/sendpulse'
import { UserRole } from '@/types/entities/user'

const notificationSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  name: z.string().optional(),
  actionUrl: z.string().optional(),
  actionText: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const authResult = await requireAuthenticatedRouteUser(request)

    if ('response' in authResult) {
      return authResult.response
    }

    const { user } = authResult

    if (!hasRouteUserRole(user, [UserRole.ADMIN, UserRole.DOCTOR])) {
      return forbiddenRouteResponse(
        'Voce nao tem permissao para enviar notificacoes por email.',
      )
    }

    const parsedBody = notificationSchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos obrigatorios faltando',
          details: parsedBody.error.flatten(),
        },
        { status: 400 },
      )
    }

    await EmailService.sendNotification(parsedBody.data)

    return NextResponse.json({
      success: true,
      error: null,
      message: 'Notificacao enviada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao enviar notificacao:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido'

    return NextResponse.json(
      {
        success: false,
        error: 'Nao foi possivel enviar a notificacao',
        message: errorMessage,
      },
      { status: 500 },
    )
  }
}
