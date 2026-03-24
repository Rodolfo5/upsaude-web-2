import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  forbiddenRouteResponse,
  hasRouteUserRole,
  requireAuthenticatedRouteUser,
} from '@/lib/server/routeAuth'
import { UserRole } from '@/types/entities/user'

const smsSchema = z.object({
  to: z.string().min(1),
  message: z.string().min(1),
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
        'Voce nao tem permissao para enviar SMS por esta rota.',
      )
    }

    const parsedBody = smsSchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Dados invalidos.', details: parsedBody.error.flatten() },
        { status: 400 },
      )
    }

    const { to, message } = parsedBody.data
    const baseUrl = process.env.INFOBIP_BASE_URL
    const apiKey = process.env.INFOBIP_API_KEY
    const from = process.env.INFOBIP_SMS_FROM

    if (!baseUrl || !apiKey || !from) {
      console.error('Variaveis de ambiente do Infobip nao configuradas')
      return NextResponse.json(
        {
          error: 'Configuracao do Infobip incompleta',
        },
        { status: 500 },
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 60000)

    const url = `${baseUrl.replace(/\/$/, '')}/sms/2/text/advanced`
    const formattedPhone = to.startsWith('55')
      ? to
      : `55${to.replace(/^\+/, '')}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `App ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              destinations: [{ to: formattedPhone }],
              from,
              text: message,
            },
          ],
        }),
        signal: controller.signal,
        redirect: 'follow',
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('Erro na API do Infobip:', errorData)
        return NextResponse.json(
          {
            error: `Erro ao enviar SMS: ${response.status} ${response.statusText}`,
          },
          { status: response.status },
        )
      }

      await response.json().catch(() => null)
      return NextResponse.json({ error: null })
    } catch (error) {
      console.error('Erro ao enviar SMS:', error)
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Erro desconhecido ao enviar SMS',
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error('Erro ao validar envio de SMS:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao enviar SMS',
      },
      { status: 500 },
    )
  }
}
