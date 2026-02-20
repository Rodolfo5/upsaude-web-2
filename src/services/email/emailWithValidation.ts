/**
 * Serviço de email com validação integrada.
 *
 * Este módulo combina validação de emails com o envio via SendPulse,
 * garantindo que apenas emails válidos sejam enviados.
 */

import { createSendPulseClient } from '@/lib/sendpulse'
import type { SendEmailParams, SendPulseEmailResponse } from '@/lib/sendpulse'
import { isValidEmail, normalizeEmail, validateEmails } from '@/utils/emailValidator'

/**
 * Erro de validação de email
 */
export class EmailValidationError extends Error {
  constructor(
    message: string,
    public invalidEmails: string[],
  ) {
    super(message)
    this.name = 'EmailValidationError'
  }
}

/**
 * Resultado de envio com validação
 */
export interface SendEmailWithValidationResult {
  success: boolean
  sent: string[]
  failed: string[]
  errors: Array<{ email: string; reason: string }>
}

/**
 * Envia email com validação automática
 */
export async function sendEmailWithValidation(
  params: SendEmailParams,
): Promise<SendPulseEmailResponse> {
  // Valida e normaliza destinatários
  const validatedTo = params.to.map((recipient) => {
    const normalizedEmail = normalizeEmail(recipient.email)

    if (!isValidEmail(normalizedEmail)) {
      throw new EmailValidationError(
        `Email inválido: ${recipient.email}`,
        [recipient.email],
      )
    }

    return {
      ...recipient,
      email: normalizedEmail,
    }
  })

  // Valida CC se existir
  if (params.cc) {
    params.cc = params.cc.map((recipient) => {
      const normalizedEmail = normalizeEmail(recipient.email)
      if (!isValidEmail(normalizedEmail)) {
        throw new EmailValidationError(
          `Email CC inválido: ${recipient.email}`,
          [recipient.email],
        )
      }
      return { ...recipient, email: normalizedEmail }
    })
  }

  // Valida BCC se existir
  if (params.bcc) {
    params.bcc = params.bcc.map((recipient) => {
      const normalizedEmail = normalizeEmail(recipient.email)
      if (!isValidEmail(normalizedEmail)) {
        throw new EmailValidationError(
          `Email BCC inválido: ${recipient.email}`,
          [recipient.email],
        )
      }
      return { ...recipient, email: normalizedEmail }
    })
  }

  // Envia o email
  const client = createSendPulseClient()
  return client.sendEmail({
    ...params,
    to: validatedTo,
  })
}

/**
 * Envia email para múltiplos destinatários com tratamento de erros individual
 */
export async function sendBulkEmailWithValidation(
  emails: string[],
  subject: string,
  html: string,
): Promise<SendEmailWithValidationResult> {
  const sent: string[] = []
  const failed: string[] = []
  const errors: Array<{ email: string; reason: string }> = []

  // Valida todos os emails primeiro
  const validationResults = validateEmails(emails)
  const validEmails = validationResults
    .filter((result) => result.isValid)
    .map((result) => result.normalized)

  const invalidEmails = validationResults
    .filter((result) => !result.isValid)
    .map((result) => result.email)

  // Registra emails inválidos
  invalidEmails.forEach((email) => {
    failed.push(email)
    errors.push({
      email,
      reason: 'Formato de email inválido',
    })
  })

  // Envia para emails válidos
  const client = createSendPulseClient()

  for (const email of validEmails) {
    try {
      await client.sendSimpleEmail(email, subject, html)
      sent.push(email)
    } catch (error) {
      failed.push(email)
      errors.push({
        email,
        reason: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    }
  }

  return {
    success: failed.length === 0,
    sent,
    failed,
    errors,
  }
}

/**
 * Envia email simples com validação
 */
export async function sendSimpleEmailWithValidation(
  to: string,
  subject: string,
  html: string,
  name?: string,
): Promise<SendPulseEmailResponse> {
  const normalizedEmail = normalizeEmail(to)

  if (!isValidEmail(normalizedEmail)) {
    throw new EmailValidationError(`Email inválido: ${to}`, [to])
  }

  const client = createSendPulseClient()
  return client.sendSimpleEmail(normalizedEmail, subject, html, name)
}

/**
 * Exemplo de uso com retry automático
 */
export async function sendEmailWithRetry(
  params: SendEmailParams,
  maxRetries = 3,
  delayMs = 1000,
): Promise<SendPulseEmailResponse> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendEmailWithValidation(params)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Erro desconhecido')

      // Não tenta novamente se for erro de validação
      if (error instanceof EmailValidationError) {
        throw error
      }

      if (attempt < maxRetries) {
        // Espera antes de tentar novamente (backoff exponencial)
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)),
        )
      }
    }
  }

  throw new Error(
    `Falha após ${maxRetries} tentativas: ${lastError?.message}`,
  )
}
