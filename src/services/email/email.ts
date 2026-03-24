import {
  getApiErrorMessage,
  postAuthenticatedJson,
} from '@/services/api/authenticatedFetch'

const sendAuthenticatedRequest = async (
  url: string,
  payload: Record<string, unknown>,
  fallbackMessage: string,
) => {
  try {
    const { response, data } = await postAuthenticatedJson<{
      error?: string
      message?: string
    }>(url, payload)

    if (!response.ok) {
      return {
        error: getApiErrorMessage(data, fallbackMessage),
      }
    }

    return { error: null }
  } catch (error) {
    console.error(error)
    return {
      error: error instanceof Error ? error.message : fallbackMessage,
    }
  }
}

export const sendInvite = async ({
  email,
  subject,
  data,
}: {
  email: string
  subject: string
  data: {
    email: string
    password: string
  }
}) =>
  sendAuthenticatedRequest(
    '/api/email',
    {
      email,
      subject,
      data: { ...data },
    },
    'Nao foi possivel enviar o email de convite.',
  )

export const sendPatientWelcome = async ({
  name,
  email,
  password,
}: {
  name: string
  email: string
  password: string
}) =>
  sendAuthenticatedRequest(
    '/api/email',
    {
      email,
      subject: 'Bem-vindo ao Upsaude!',
      data: {
        name,
        email,
        password,
      },
      template: 'patient-welcome',
    },
    'Nao foi possivel enviar o email de boas-vindas do paciente.',
  )

export const sendDoctorWelcome = async ({
  name,
  email,
  password,
}: {
  name: string
  email: string
  password: string
}) =>
  sendAuthenticatedRequest(
    '/api/email',
    {
      email,
      subject: 'Bem-vindo ao Upsaude!',
      data: {
        name,
        email,
        password,
      },
      template: 'doctor-welcome',
    },
    'Nao foi possivel enviar o email de boas-vindas do profissional.',
  )

export const sendNotification = async ({
  to,
  subject,
  title,
  message,
  name,
  actionUrl,
  actionText,
}: {
  to: string
  subject: string
  title: string
  message: string
  name?: string
  actionUrl?: string
  actionText?: string
}) =>
  sendAuthenticatedRequest(
    '/api/email/notification',
    {
      to,
      subject,
      title,
      message,
      name,
      actionUrl,
      actionText,
    },
    'Nao foi possivel enviar a notificacao por email.',
  )
