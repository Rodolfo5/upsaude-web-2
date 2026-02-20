/**
 * Função para enviar um convite por email utilizando a API interna.
 *
 * Esta função faz uma requisição POST para o endpoint `/api/email` com os dados necessários
 * para enviar um email de convite. Caso ocorra um erro, ele será capturado e retornado.
 *
 * @param email - O endereço de email do destinatário.
 * @param subject - O assunto do email.
 * @param data - Dados adicionais para o email, incluindo:
 *   - email: O email do destinatário.
 *   - password: A senha gerada ou associada ao destinatário.
 *
 * @returns Um objeto contendo:
 *   - `error`: `null` se o envio foi bem-sucedido, ou uma mensagem de erro se falhou.
 *
 * @example
 * ```typescript
 * const response = await sendInvite({
 *   email: 'jose@souv.tech',
 *   subject: 'Bem-vindo ao Diabetopedia!',
 *   data: {
 *     email: 'jose@souv.tech',
 *     password: 'senha123',
 *   },
 * });
 *
 * if (response.error) {
 *   console.error('Erro ao enviar email:', response.error);
 * } else {
 *   console.log('Email enviado com sucesso!');
 * }
 * ```
 */
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
}) => {
  return await fetch('/api/email', {
    method: 'post',
    body: JSON.stringify({
      email,
      subject,
      data: { ...data },
    }),
  })
    .then(() => ({ error: null }))
    .catch((err: string) => {
      console.error(err)
      return {
        error: err,
      }
    })
}

/**
 * Função para enviar um email de boas-vindas ao paciente quando a conta for criada.
 *
 * Esta função faz uma requisição POST para o endpoint `/api/email` com os dados necessários
 * para enviar um email de boas-vindas. Caso ocorra um erro, ele será capturado e retornado.
 *
 * @param name - O nome do paciente.
 * @param email - O endereço de email do destinatário.
 *
 * @returns Um objeto contendo:
 *   - `error`: `null` se o envio foi bem-sucedido, ou uma mensagem de erro se falhou.
 *
 * @example
 * ```typescript
 * const response = await sendPatientWelcome({
 *   name: 'João Silva',
 *   email: 'joao@example.com',
 * });
 *
 * if (response.error) {
 *   console.error('Erro ao enviar email:', response.error);
 * } else {
 *   console.log('Email enviado com sucesso!');
 * }
 * ```
 */
export const sendPatientWelcome = async ({
  name,
  email,
  password,
}: {
  name: string
  email: string
  password: string
}) => {
  return await fetch('/api/email', {
    method: 'post',
    body: JSON.stringify({
      email,
      subject: 'Bem-vindo ao Upsaude!',
      data: {
        name,
        email,
        password,
      },
      template: 'patient-welcome',
    }),
  })
    .then(() => ({ error: null }))
    .catch((err: string) => {
      console.error(err)
      return {
        error: err,
      }
    })
}

export const sendDoctorWelcome = async ({
  name,
  email,
  password,
}: {
  name: string
  email: string
  password: string
}) => {
  return await fetch('/api/email', {
    method: 'post',
    body: JSON.stringify({
      email,
      subject: 'Bem-vindo ao Upsaude!',
      data: {
        name,
        email,
        password,
      },
      template: 'doctor-welcome',
    }),
  })
    .then(() => ({ error: null }))
    .catch((err: string) => {
      console.error(err)
      return {
        error: err,
      }
    })
}

/**
 * Função para enviar um email de notificação personalizado.
 *
 * Esta função permite enviar emails de notificação com conteúdo personalizado.
 *
 * @param to - O endereço de email do destinatário.
 * @param subject - O assunto do email.
 * @param title - O título principal do email.
 * @param message - A mensagem do email.
 * @param name - O nome do destinatário (opcional).
 * @param actionUrl - URL para ação (opcional).
 * @param actionText - Texto do botão de ação (opcional).
 *
 * @returns Um objeto contendo:
 *   - `error`: `null` se o envio foi bem-sucedido, ou uma mensagem de erro se falhou.
 *
 * @example
 * ```typescript
 * const response = await sendNotification({
 *   to: 'usuario@example.com',
 *   subject: 'Nova Consulta Agendada',
 *   title: 'Consulta Confirmada',
 *   message: 'Sua consulta foi agendada para 15/02/2026 às 14:00',
 *   name: 'João Silva',
 * });
 * ```
 */
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
}) => {
  return await fetch('/api/email/notification', {
    method: 'post',
    body: JSON.stringify({
      to,
      subject,
      title,
      message,
      name,
      actionUrl,
      actionText,
    }),
  })
    .then(() => ({ error: null }))
    .catch((err: string) => {
      console.error(err)
      return {
        error: err,
      }
    })
}
