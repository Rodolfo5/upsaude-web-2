import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

const SHA1_SIGNATURE_LENGTH = 40

const normalizeSignature = (signatureHeader: string) =>
  signatureHeader
    .trim()
    .replace(/^sha1=/i, '')
    .toLowerCase()

export const getPagarmeWebhookSignatureHeader = (request: Request) =>
  request.headers.get('x-hub-signature')

export const getPagarmeWebhookSigningKey = () => {
  const signingKey =
    process.env.PAGARME_WEBHOOK_API_KEY || process.env.PAGARME_API_KEY

  if (!signingKey) {
    throw new Error(
      'Configure PAGARME_WEBHOOK_API_KEY ou PAGARME_API_KEY para validar a assinatura do webhook do Pagar.me.',
    )
  }

  return signingKey
}

export const verifyPagarmeWebhookSignature = (
  rawBody: string,
  signatureHeader: string,
) => {
  const normalizedSignature = normalizeSignature(signatureHeader)

  if (
    normalizedSignature.length !== SHA1_SIGNATURE_LENGTH ||
    !/^[a-f0-9]+$/i.test(normalizedSignature)
  ) {
    return false
  }

  const expectedSignature = createHmac('sha1', getPagarmeWebhookSigningKey())
    .update(rawBody, 'utf8')
    .digest('hex')

  const expectedBuffer = Buffer.from(expectedSignature, 'hex')
  const receivedBuffer = Buffer.from(normalizedSignature, 'hex')

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer)
}
