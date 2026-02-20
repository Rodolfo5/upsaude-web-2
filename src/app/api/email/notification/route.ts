/**
 * Endpoint para envio de notificações por email.
 *
 * Este endpoint facilita o envio de emails de notificação com template padrão.
 *
 * @param request - A requisição HTTP contendo os dados da notificação.
 * @returns Uma resposta JSON indicando sucesso ou erro.
 */
import { NextResponse } from 'next/server'

import { EmailService } from '@/services/email/sendpulse'

export async function POST(request: Request) {
  try {
    const data: {
      to: string
      subject: string
      title: string
      message: string
      name?: string
      actionUrl?: string
      actionText?: string
    } = await request.json()

    // Valida campos obrigatórios
    if (!data.to || !data.subject || !data.title || !data.message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos obrigatórios faltando',
          message: 'to, subject, title e message são obrigatórios',
        },
        { status: 400 },
      )
    }

    // Envia a notificação usando o EmailService
    await EmailService.sendNotification({
      to: data.to,
      subject: data.subject,
      title: data.title,
      message: data.message,
      name: data.name,
      actionUrl: data.actionUrl,
      actionText: data.actionText,
    })

    return NextResponse.json({
      success: true,
      error: null,
      message: 'Notificação enviada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao enviar notificação:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido'

    return NextResponse.json(
      {
        success: false,
        error: 'Não foi possível enviar a notificação',
        message: errorMessage,
      },
      { status: 500 },
    )
  }
}
