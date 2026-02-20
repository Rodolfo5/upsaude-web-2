/**
 * Tipos TypeScript para a integração com a API do SendPulse.
 *
 * Documentação da API: https://sendpulse.com/api
 */

/**
 * Resposta de autenticação do SendPulse OAuth2
 */
export interface SendPulseAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

/**
 * Configuração do cliente SendPulse
 */
export interface SendPulseConfig {
  clientId: string
  clientSecret: string
  fromEmail: string
  fromName: string
}

/**
 * Destinatário de email
 */
export interface EmailRecipient {
  email: string
  name?: string
}

/**
 * Dados para envio de email
 */
export interface SendEmailParams {
  to: EmailRecipient[]
  subject: string
  html: string
  text?: string
  bcc?: EmailRecipient[]
  cc?: EmailRecipient[]
  replyTo?: string
  attachments?: EmailAttachment[]
}

/**
 * Anexo de email
 */
export interface EmailAttachment {
  name: string
  content: string // Base64 encoded
  type: string
}

/**
 * Resposta da API de envio de email do SendPulse
 */
export interface SendPulseEmailResponse {
  result: boolean
  message?: string
  errors?: string[]
}

/**
 * Erro da API do SendPulse
 */
export interface SendPulseError {
  error: string
  error_description?: string
}
