/**
 * Templates HTML para notificações por e-mail.
 *
 * Gera conteúdo HTML para cada tipo de evento de notificação.
 */

/**
 * Template base para notificações.
 */
function getBaseTemplate(
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string,
  metadata?: Record<string, unknown>,
): string {
  const actionHtml =
    actionUrl && actionText
      ? `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <a href="${actionUrl}" style="background-color: #792EBD; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              ${actionText}
            </a>
          </td>
        </tr>
      </table>
      `
      : ''

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background-color: #792EBD; padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${title}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 20px;">
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      ${message}
                    </p>
                    ${actionHtml}
                    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                      Atenciosamente,<br>
                      <strong>Equipe Upsaude</strong>
                    </p>
                  </td>
                </tr>
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
 * Retorna template HTML para o tipo de evento.
 */
export function getNotificationTemplate(
  eventType: string,
  title: string,
  message: string,
  metadata: Record<string, unknown>,
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.upsaude.com'

  switch (eventType) {
    case 'questionnaire_not_answered':
      return getBaseTemplate(
        title,
        message,
        `${appUrl}/questionarios`,
        'Ver Questionários',
        metadata,
      )

    case 'plan_not_completed':
    case 'plan_reevaluation_requested':
    case 'all_goals_completed':
    case 'goal_completed':
    case 'plan_altered_by_other_doctor': {
      const patientId = metadata.patientId as string
      const planId = metadata.planId as string
      const url =
        patientId && planId
          ? `${appUrl}/pacientes/${patientId}/plano-terapeutico/${planId}`
          : `${appUrl}/pacientes`
      return getBaseTemplate(
        title,
        message,
        url,
        'Ver Plano Terapêutico',
        metadata,
      )
    }

    case 'exam_pending':
    case 'exam_completed': {
      const patientId = metadata.patientId as string
      const url = patientId
        ? `${appUrl}/pacientes/${patientId}`
        : `${appUrl}/pacientes`
      return getBaseTemplate(title, message, url, 'Ver Paciente', metadata)
    }

    case 'medication_not_followed': {
      const patientId = metadata.patientId as string
      const url = patientId
        ? `${appUrl}/pacientes/${patientId}`
        : `${appUrl}/pacientes`
      return getBaseTemplate(title, message, url, 'Ver Paciente', metadata)
    }

    case 'consultation_scheduled':
    case 'consultation_reminder':
      return getBaseTemplate(
        title,
        message,
        `${appUrl}/agenda`,
        'Ver Agenda',
        metadata,
      )

    case 'consultation_canceled':
      return getBaseTemplate(
        title,
        message,
        `${appUrl}/agenda`,
        'Agendar Nova Consulta',
        metadata,
      )

    case 'checkup_pending':
    case 'checkup_not_responded': {
      const patientId = metadata.patientId as string
      const url = patientId
        ? `${appUrl}/pacientes/${patientId}`
        : `${appUrl}/pacientes`
      return getBaseTemplate(title, message, url, 'Ver Check-up', metadata)
    }

    case 'new_message': {
      const chatId = metadata.chatId as string
      const url = chatId ? `${appUrl}/chat?chat=${chatId}` : `${appUrl}/chat`
      return getBaseTemplate(title, message, url, 'Abrir Chat', metadata)
    }

    case 'doctor_left_platform':
      return getBaseTemplate(
        title,
        message,
        appUrl,
        'Acessar Plataforma',
        metadata,
      )

    default:
      return getBaseTemplate(title, message, undefined, undefined, metadata)
  }
}
