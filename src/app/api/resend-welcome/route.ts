import { render } from '@react-email/components'
import admin from 'firebase-admin'
import { NextResponse } from 'next/server'

import { adminFirestore, getAdminApp } from '@/config/firebase/firebaseAdmin'
import { createSendPulseClient } from '@/lib/sendpulse'
import {
  forbiddenRouteResponse,
  hasRouteUserRole,
  requireAuthenticatedRouteUser,
} from '@/lib/server/routeAuth'
import { UserRole } from '@/types/entities/user'
import { generateRandomPassword } from '@/utils/generateRandomPassword'
import PatientWelcomeEmail from '../email/template/patient-welcome'

interface ResendWelcomeRequest {
  patientId: string
}

interface ResendWelcomeResponse {
  success: boolean
  error: string | null
  warnings: string[]
}

export async function POST(
  request: Request,
): Promise<NextResponse<ResendWelcomeResponse>> {
  try {
    const authResult = await requireAuthenticatedRouteUser(request)

    if ('response' in authResult) {
      return authResult.response as NextResponse<ResendWelcomeResponse>
    }

    const { user } = authResult

    if (!hasRouteUserRole(user, [UserRole.ADMIN, UserRole.DOCTOR])) {
      return forbiddenRouteResponse(
        'Apenas administradores ou médicos podem reenviar notificações.',
      ) as NextResponse<ResendWelcomeResponse>
    }

    const body = (await request.json()) as Partial<ResendWelcomeRequest>
    const patientId = body.patientId?.trim()

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'patientId é obrigatório.', warnings: [] },
        { status: 400 },
      )
    }

    await getAdminApp()
    const db = adminFirestore()

    // Busca dados do paciente no Firestore
    const patientDoc = await db.collection('users').doc(patientId).get()

    if (!patientDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Paciente não encontrado.', warnings: [] },
        { status: 404 },
      )
    }

    const patientData = patientDoc.data()!
    const email: string = patientData.email
    const name: string = patientData.name
    const phone: string = patientData.phone ?? ''
    const uid: string = patientData.uid ?? patientId

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Paciente sem email cadastrado.', warnings: [] },
        { status: 400 },
      )
    }

    // Gera nova senha temporária e atualiza no Firebase Auth
    const newPassword = generateRandomPassword()
    await admin.auth().updateUser(uid, { password: newPassword })

    const warnings: string[] = []

    // Reenvia email de boas-vindas diretamente via SendPulse
    try {
      const emailHTML = await render(
        PatientWelcomeEmail({ name, email, password: newPassword }),
      )
      const sendPulseClient = createSendPulseClient()
      await sendPulseClient.sendEmail({
        to: [{ email, name }],
        subject: 'Bem-vindo ao Upsaude!',
        html: emailHTML,
      })
    } catch (emailError) {
      warnings.push(
        `Email: ${emailError instanceof Error ? emailError.message : 'Erro ao enviar email'}`,
      )
    }

    // Reenvia SMS diretamente via Infobip (somente se tiver telefone)
    if (phone) {
      try {
        const baseUrl = process.env.INFOBIP_BASE_URL
        const apiKey = process.env.INFOBIP_API_KEY
        const from = process.env.INFOBIP_SMS_FROM

        if (!baseUrl || !apiKey || !from) {
          warnings.push('SMS: Configuracao do Infobip incompleta')
        } else {
          const formattedPhone = phone.startsWith('55')
            ? phone
            : `55${phone.replace(/^\+/, '')}`

          const smsUrl = `${baseUrl.replace(/\/$/, '')}/sms/2/text/advanced`
          const message = `Ola ${name}! Sua conta foi criada com sucesso na plataforma Upsaude. Sua senha e: ${newPassword}. Use seu email: ${email} para fazer login.`

          const smsResponse = await fetch(smsUrl, {
            method: 'POST',
            headers: {
              Authorization: `App ${apiKey}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              messages: [{ destinations: [{ to: formattedPhone }], from, text: message }],
            }),
          })

          if (!smsResponse.ok) {
            warnings.push(`SMS: Erro ao enviar (status ${smsResponse.status})`)
          }
        }
      } catch (smsError) {
        warnings.push(
          `SMS: ${smsError instanceof Error ? smsError.message : 'Erro ao enviar SMS'}`,
        )
      }
    }

    return NextResponse.json({
      success: true,
      error: null,
      warnings,
    })
  } catch (error) {
    console.error('Erro ao reenviar boas-vindas:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno ao reenviar.',
        warnings: [],
      },
      { status: 500 },
    )
  }
}
