/**
 * Endpoint para envio de emails utilizando o SendPulse e React Email.
 *
 * Este endpoint recebe uma requisição POST com os dados necessários para enviar um email.
 * Ele utiliza o SendPulse para enviar o email e o React Email para renderizar o HTML do template.
 *
 * @param request - A requisição HTTP contendo os dados do email.
 * @returns Uma resposta JSON indicando sucesso ou erro.
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/email', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     email: 'jose@souv.tech',
 *     subject: 'Bem-vindo ao Upsaude!',
 *     data: {
 *       email: 'jose@souv.tech',
 *       password: 'senha123',
 *       name: 'José Silva',
 *     },
 *     template: 'patient-welcome',
 *   }),
 * });
 *
 * const result = await response.json();
 * if (result.error) {
 *   console.error('Erro ao enviar email:', result.error);
 * } else {
 *   console.log('Email enviado com sucesso!');
 * }
 * ```
 */
import { render } from '@react-email/components'
import { NextResponse } from 'next/server'

import { createSendPulseClient } from '@/lib/sendpulse'

import DoctorWelcomeEmail from './template/doctor-welcome'
import TemplateEmail from './template/email'
import PatientWelcomeEmail from './template/patient-welcome'

export async function POST(request: Request) {
  try {
    const data: {
      email: string
      data: {
        email: string
        password?: string
        name?: string
      }
      subject: string
      template?: string
    } = await request.json()

    // Renderiza o template HTML baseado no tipo especificado
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

    // Cria o cliente SendPulse e envia o email
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
        error: 'Não foi possível enviar o email',
        message: errorMessage,
      },
      { status: 500 },
    )
  }
}
