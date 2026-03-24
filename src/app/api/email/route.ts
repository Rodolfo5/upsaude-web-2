import { render } from '@react-email/components'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createSendPulseClient } from '@/lib/sendpulse'
import {
  forbiddenRouteResponse,
  hasRouteUserRole,
  requireAuthenticatedRouteUser,
} from '@/lib/server/routeAuth'
import { UserRole } from '@/types/entities/user'

import DoctorWelcomeEmail from './template/doctor-welcome'
import TemplateEmail from './template/email'
import PatientWelcomeEmail from './template/patient-welcome'

const emailSchema = z.object({
  email: z.string().email(),
  subject: z.string().min(1),
  template: z.string().optional(),
  data: z.object({
    email: z.string().email(),
    password: z.string().optional(),
    name: z.string().optional(),
  }),
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
        'Voce nao tem permissao para enviar emails por esta rota.',
      )
    }

    const parsedBody = emailSchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: parsedBody.error.flatten() },
        { status: 400 },
      )
    }

    const data = parsedBody.data
    let emailHTML: string

    if (data.template === 'patient-welcome') {
      emailHTML = await render(
        PatientWelcomeEmail({
          name: data.data.name || '',
          email: data.data.email,
          password: data.data.password || '',
        }),
      )
    } else if (data.template === 'doctor-welcome') {
      emailHTML = await render(
        DoctorWelcomeEmail({
          name: data.data.name || '',
          email: data.data.email,
          password: data.data.password || '',
        }),
      )
    } else {
      emailHTML = await render(
        TemplateEmail({
          email: data.data.email,
          password: data.data.password || '',
        }),
      )
    }

    const sendPulseClient = createSendPulseClient()

    await sendPulseClient.sendEmail({
      to: [
        {
          email: data.email,
          name: data.data.name || data.email,
        },
      ],
      subject: data.subject,
      html: emailHTML,
    })

    return NextResponse.json({
      success: true,
      error: null,
      message: 'Email enviado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao enviar email:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido'

    return NextResponse.json(
      {
        success: false,
        error: 'Nao foi possivel enviar o email',
        message: errorMessage,
      },
      { status: 500 },
    )
  }
}
