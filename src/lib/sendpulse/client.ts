/**
 * Cliente SendPulse para envio de emails via API.
 *
 * Este cliente gerencia a autenticação OAuth2 e o envio de emails através da API do SendPulse.
 * A autenticação é feita automaticamente e o token é armazenado em memória com renovação automática.
 *
 * Documentação da API: https://sendpulse.com/api
 *
 * @example
 * ```typescript
 * const client = new SendPulseClient({
 *   clientId: process.env.SENDPULSE_CLIENT_ID!,
 *   clientSecret: process.env.SENDPULSE_CLIENT_SECRET!,
 *   fromEmail: process.env.SENDPULSE_FROM_EMAIL!,
 *   fromName: process.env.SENDPULSE_FROM_NAME!,
 * });
 *
 * await client.sendEmail({
 *   to: [{ email: 'usuario@example.com', name: 'João Silva' }],
 *   subject: 'Bem-vindo!',
 *   html: '<h1>Olá, João!</h1>',
 * });
 * ```
 */

import type {
  SendPulseAuthResponse,
  SendPulseConfig,
  SendPulseEmailResponse,
  SendPulseError,
  SendEmailParams,
} from './types'

/**
 * URL base da API do SendPulse
 */
const SENDPULSE_API_URL = 'https://api.sendpulse.com'

/**
 * Cliente para interação com a API do SendPulse
 */
export class SendPulseClient {
  private config: SendPulseConfig
  private accessToken: string | null = null
  private tokenExpiresAt: number = 0

  constructor(config: SendPulseConfig) {
    this.config = config
  }

  /**
   * Obtém um token de acesso válido, renovando se necessário
   */
  private async getAccessToken(): Promise<string> {
    // Verifica se o token ainda é válido (com margem de 5 minutos)
    const now = Date.now()
    if (this.accessToken && this.tokenExpiresAt > now + 5 * 60 * 1000) {
      return this.accessToken
    }

    // Renova o token
    await this.authenticate()
    return this.accessToken!
  }

  /**
   * Realiza a autenticação OAuth2 com o SendPulse
   */
  private async authenticate(): Promise<void> {
    const url = `${SENDPULSE_API_URL}/oauth/access_token`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    })

    if (!response.ok) {
      const error: SendPulseError = await response.json()
      throw new Error(
        `Falha na autenticação SendPulse: ${error.error} - ${error.error_description || ''}`,
      )
    }

    const data: SendPulseAuthResponse = await response.json()

    this.accessToken = data.access_token
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000
  }

  /**
   * Envia um email através da API do SendPulse
   *
   * @param params - Parâmetros do email a ser enviado
   * @returns Resposta da API indicando sucesso ou falha
   *
   * @throws Error se houver falha no envio
   */
  async sendEmail(params: SendEmailParams): Promise<SendPulseEmailResponse> {
    const token = await this.getAccessToken()
    const url = `${SENDPULSE_API_URL}/smtp/emails`

    // Prepara o payload conforme a API do SendPulse
    const payload = {
      email: {
        html: params.html,
        text: params.text || '',
        subject: params.subject,
        from: {
          name: this.config.fromName,
          email: this.config.fromEmail,
        },
        to: params.to.map((recipient) => ({
          name: recipient.name || recipient.email,
          email: recipient.email,
        })),
        bcc: params.bcc?.map((recipient) => ({
          name: recipient.name || recipient.email,
          email: recipient.email,
        })),
        cc: params.cc?.map((recipient) => ({
          name: recipient.name || recipient.email,
          email: recipient.email,
        })),
        reply_to: params.replyTo
          ? {
              email: params.replyTo,
            }
          : undefined,
        attachments: params.attachments,
      },
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        `Falha no envio de email: ${error.message || response.statusText}`,
      )
    }

    const data: SendPulseEmailResponse = await response.json()

    if (!data.result) {
      throw new Error(
        `Erro ao enviar email: ${data.message || data.errors?.join(', ') || 'Erro desconhecido'}`,
      )
    }

    return data
  }

  /**
   * Envia um email simples com destinatário único
   *
   * @param to - Email do destinatário
   * @param subject - Assunto do email
   * @param html - Conteúdo HTML do email
   * @param name - Nome do destinatário (opcional)
   */
  async sendSimpleEmail(
    to: string,
    subject: string,
    html: string,
    name?: string,
  ): Promise<SendPulseEmailResponse> {
    return this.sendEmail({
      to: [{ email: to, name }],
      subject,
      html,
    })
  }
}

/**
 * Cria e retorna uma instância do cliente SendPulse usando variáveis de ambiente
 */
export function createSendPulseClient(): SendPulseClient {
  const clientId = process.env.SENDPULSE_CLIENT_ID
  const clientSecret = process.env.SENDPULSE_CLIENT_SECRET
  const fromEmail = process.env.SENDPULSE_FROM_EMAIL
  const fromName = process.env.SENDPULSE_FROM_NAME

  if (!clientId || !clientSecret || !fromEmail || !fromName) {
    throw new Error(
      'Configurações do SendPulse não encontradas. Verifique as variáveis de ambiente.',
    )
  }

  return new SendPulseClient({
    clientId,
    clientSecret,
    fromEmail,
    fromName,
  })
}
