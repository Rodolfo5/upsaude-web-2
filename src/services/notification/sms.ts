/**
 * Função para enviar SMS utilizando a API interna.
 *
 * Esta função faz uma requisição POST para o endpoint `/api/sms` com os dados necessários
 * para enviar um SMS. Caso ocorra um erro, ele será capturado e retornado.
 *
 * @param to - O número de telefone do destinatário (formato internacional, ex: +5511999999999).
 * @param message - O conteúdo da mensagem SMS.
 *
 * @returns Um objeto contendo:
 *   - `error`: `null` se o envio foi bem-sucedido, ou uma mensagem de erro se falhou.
 *
 * @example
 * ```typescript
 * const response = await sendSMS({
 *   to: '5511999999999',
 *   message: 'Sua conta foi criada com sucesso!',
 * });
 *
 * if (response.error) {
 *   console.error('Erro ao enviar SMS:', response.error);
 * } else {
 *   console.log('SMS enviado com sucesso!');
 * }
 * ```
 */
export const sendSMS = async ({
  to,
  message,
}: {
  to: string
  message: string
}) => {
  return await fetch('/api/sms', {
    method: 'post',
    body: JSON.stringify({
      to,
      message,
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
 * Função para enviar SMS de boas-vindas ao paciente quando a conta for criada.
 *
 * @param name - O nome do paciente.
 * @param phone - O número de telefone do paciente.
 *
 * @returns Um objeto contendo:
 *   - `error`: `null` se o envio foi bem-sucedido, ou uma mensagem de erro se falhou.
 */
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
  const message = `Olá ${name}! Sua conta foi criada com sucesso na plataforma Upsaude. Sua senha é: ${password}. Use seu email: ${email} para fazer login.`

  return await sendSMS({
    to: phone,
    message,
  })
}
