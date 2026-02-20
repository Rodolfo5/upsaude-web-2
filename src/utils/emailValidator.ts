/**
 * Utilitários para validação de emails.
 *
 * Fornece funções para validar emails antes de enviar via SendPulse.
 */

/**
 * Valida se um email tem formato válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida se um email tem formato válido e não é de domínio temporário
 */
export function isValidBusinessEmail(email: string): boolean {
  if (!isValidEmail(email)) {
    return false
  }

  // Lista de domínios temporários/descartáveis comuns
  const temporaryDomains = [
    'tempmail.com',
    'throwaway.email',
    'guerrillamail.com',
    '10minutemail.com',
    'mailinator.com',
    'trashmail.com',
  ]

  const domain = email.split('@')[1]?.toLowerCase()
  return !temporaryDomains.includes(domain)
}

/**
 * Normaliza um email (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Valida uma lista de emails
 */
export function validateEmailList(
  emails: string[],
): { valid: string[]; invalid: string[] } {
  const valid: string[] = []
  const invalid: string[] = []

  for (const email of emails) {
    const normalized = normalizeEmail(email)
    if (isValidEmail(normalized)) {
      valid.push(normalized)
    } else {
      invalid.push(email)
    }
  }

  return { valid, invalid }
}

/**
 * Extrai o domínio de um email
 */
export function getEmailDomain(email: string): string | null {
  if (!isValidEmail(email)) {
    return null
  }
  return email.split('@')[1]?.toLowerCase() || null
}

/**
 * Mascara um email para exibição (ex: jo***@example.com)
 */
export function maskEmail(email: string): string {
  if (!isValidEmail(email)) {
    return email
  }

  const [local, domain] = email.split('@')
  const maskedLocal =
    local.length <= 2
      ? local
      : local.substring(0, 2) + '*'.repeat(Math.min(local.length - 2, 3))

  return `${maskedLocal}@${domain}`
}

/**
 * Verifica se um email pertence a um domínio específico
 */
export function isEmailFromDomain(email: string, domain: string): boolean {
  const emailDomain = getEmailDomain(email)
  return emailDomain === domain.toLowerCase()
}

/**
 * Valida múltiplos emails e retorna resultado detalhado
 */
export interface EmailValidationResult {
  email: string
  isValid: boolean
  normalized: string
  domain: string | null
  error?: string
}

export function validateEmails(emails: string[]): EmailValidationResult[] {
  return emails.map((email) => {
    const normalized = normalizeEmail(email)
    const isValid = isValidEmail(normalized)
    const domain = getEmailDomain(normalized)

    return {
      email,
      isValid,
      normalized,
      domain,
      error: isValid ? undefined : 'Formato de email inválido',
    }
  })
}
