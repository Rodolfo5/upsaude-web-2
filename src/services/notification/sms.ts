import {
  getApiErrorMessage,
  postAuthenticatedJson,
} from '@/services/api/authenticatedFetch'

export const sendSMS = async ({
  to,
  message,
}: {
  to: string
  message: string
}) => {
  try {
    const { response, data } = await postAuthenticatedJson<{
      error?: string
      message?: string
    }>('/api/sms', {
      to,
      message,
    })

    if (!response.ok) {
      return {
        error: getApiErrorMessage(data, 'Nao foi possivel enviar o SMS.'),
      }
    }

    return { error: null }
  } catch (error) {
    console.error(error)
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Nao foi possivel enviar o SMS.',
    }
  }
}

export const sendPatientWelcomeSMS = async ({
  name,
  phone,
  password,
  email,
}: {
  name: string
  phone: string
  password: string
  email: string
}) => {
  const message = `Ola ${name}! Sua conta foi criada com sucesso na plataforma Upsaude. Sua senha e: ${password}. Use seu email: ${email} para fazer login.`

  return sendSMS({
    to: phone,
    message,
  })
}
