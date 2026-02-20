/**
 * Módulo de integração com SendPulse
 *
 * Exporta cliente, tipos e utilitários para envio de emails via SendPulse API
 */

export { SendPulseClient, createSendPulseClient } from './client'
export type {
  SendPulseAuthResponse,
  SendPulseConfig,
  SendPulseEmailResponse,
  SendPulseError,
  SendEmailParams,
  EmailRecipient,
  EmailAttachment,
} from './types'
