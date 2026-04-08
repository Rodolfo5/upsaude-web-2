/**
 * Serviço auxiliar para envio de emails utilizando SendPulse.
 *
 * Este serviço fornece métodos convenientes para envio de emails
 * comuns no sistema, como boas-vindas, notificações, etc.
 *
 * @example
 * ```typescript
 * import { EmailService } from '@/services/email/sendpulse'
 *
 * await EmailService.sendWelcomePatient({
 *   name: 'João Silva',
 *   email: 'joao@example.com',
 *   password: 'senha123'
 * })
 * ```
 */

import { render } from '@react-email/components'

import DoctorWelcomeEmail from '@/app/api/email/template/doctor-welcome'
import PatientWelcomeEmail from '@/app/api/email/template/patient-welcome'
import { createSendPulseClient } from '@/lib/sendpulse'
import type { SendPulseEmailResponse } from '@/lib/sendpulse'

/**
 * Parâmetros para email de boas-vindas
 */
interface WelcomeEmailParams {
  name: string
  email: string
  password: string
}

/**
 * Parâmetros para email customizado
 */
interface CustomEmailParams {
  to: string
  subject: string
  html: string
  name?: string
  replyTo?: string
}

/**
 * Parâmetros para notificação genérica
 */
interface NotificationEmailParams {
  to: string
  subject: string
  title: string
  message: string
  name?: string
  actionUrl?: string
  actionText?: string
}

/**
 * Serviço de envio de emails
 */
export class EmailService {
  /**
   * Envia email de boas-vindas para paciente
   */
  static async sendWelcomePatient(
    params: WelcomeEmailParams,
  ): Promise<SendPulseEmailResponse> {
    const client = createSendPulseClient()

    const emailHTML = await render(
      PatientWelcomeEmail({
        name: params.name,
        email: params.email,
        password: params.password,
      }),
    )

    return client.sendEmail({
      to: [
        {
          email: params.email,
          name: params.name,
        },
      ],
      subject: 'Bem-vindo ao Upsaude!',
      html: emailHTML,
    })
  }

  /**
   * Envia email de boas-vindas para médico
   */
  static async sendWelcomeDoctor(
    params: WelcomeEmailParams,
  ): Promise<SendPulseEmailResponse> {
    const client = createSendPulseClient()

    const emailHTML = await render(
      DoctorWelcomeEmail({
        name: params.name,
        email: params.email,
        password: params.password,
      }),
    )

    return client.sendEmail({
      to: [
        {
          email: params.email,
          name: params.name,
        },
      ],
      subject: 'Bem-vindo à equipe Upsaude!',
      html: emailHTML,
    })
  }

  /**
   * Envia email customizado com HTML
   */
  static async sendCustomEmail(
    params: CustomEmailParams,
  ): Promise<SendPulseEmailResponse> {
    const client = createSendPulseClient()

    return client.sendEmail({
      to: [
        {
          email: params.to,
          name: params.name || params.to,
        },
      ],
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
    })
  }

  /**
   * Envia notificação genérica com template simples
   */
  static async sendNotification(
    params: NotificationEmailParams,
  ): Promise<SendPulseEmailResponse> {
    const html = EmailService.createNotificationTemplate(params)
    return EmailService.sendCustomEmail({
      to: params.to,
      subject: params.subject,
      html,
      name: params.name,
    })
  }

  /**
   * Cria template HTML para notificação genérica
   */
  private static createNotificationTemplate(
    params: NotificationEmailParams,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${params.subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #792EBD; padding: 30px 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${params.title}</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 30px 20px;">
                      ${params.name ? `<p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">Olá, <strong>${params.name}</strong>!</p>` : ''}
                      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        ${params.message}
                      </p>
                      
                      ${
                        params.actionUrl && params.actionText
                          ? `
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${params.actionUrl}" style="background-color: #792EBD; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                              ${params.actionText}
                            </a>
                          </td>
                        </tr>
                      </table>
                      `
                          : ''
                      }
                      
                      <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                        Atenciosamente,<br>
                        <strong>Equipe Upsaude</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                      <p style="color: #999; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} Upsaude. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  }

  /**
   * Envia email de redefinição de senha
   */
  static async sendPasswordReset(
    email: string,
    name: string,
    resetUrl: string,
  ): Promise<SendPulseEmailResponse> {
    return EmailService.sendNotification({
      to: email,
      name,
      subject: 'Redefinição de Senha - Upsaude',
      title: 'Redefinição de Senha',
      message:
        'Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha. Se você não solicitou esta alteração, ignore este email.',
      actionUrl: resetUrl,
      actionText: 'Redefinir Senha',
    })
  }

  /**
   * Envia email de confirmação de consulta
   */
  static async sendAppointmentConfirmation(
    email: string,
    name: string,
    appointmentDate: string,
    appointmentTime: string,
    doctorName: string,
  ): Promise<SendPulseEmailResponse> {
    return EmailService.sendNotification({
      to: email,
      name,
      subject: 'Confirmação de Consulta - Upsaude',
      title: 'Consulta Confirmada',
      message: `Sua consulta foi confirmada para <strong>${appointmentDate}</strong> às <strong>${appointmentTime}</strong> com <strong>Dr(a). ${doctorName}</strong>.`,
      actionUrl: process.env.NEXT_PUBLIC_APP_URL,
      actionText: 'Ver Detalhes',
    })
  }

  /**
   * Envia lembrete de consulta
   */
  static async sendAppointmentReminder(
    email: string,
    name: string,
    appointmentDate: string,
    appointmentTime: string,
    doctorName: string,
  ): Promise<SendPulseEmailResponse> {
    return EmailService.sendNotification({
      to: email,
      name,
      subject: 'Lembrete de Consulta - Upsaude',
      title: 'Lembrete de Consulta',
      message: `Lembramos que você tem uma consulta agendada para <strong>${appointmentDate}</strong> às <strong>${appointmentTime}</strong> com <strong>Dr(a). ${doctorName}</strong>.`,
      actionUrl: process.env.NEXT_PUBLIC_APP_URL,
      actionText: 'Acessar Plataforma',
    })
  }
}
