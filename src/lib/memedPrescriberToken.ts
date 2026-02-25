import { getAdminApp } from '@/config/firebase/firebaseAdmin'
import { memedService } from '@/services/memed'
import { getUserDoc } from '@/services/user'

export type GetFreshPrescriberTokenResult =
  | { success: true; token: string }
  | {
      success: false
      error: string
      doctorNotRegistered?: boolean
    }

/**
 * Obtém o último token válido do prescritor na API Memed.
 * O token não é estático; deve ser recuperado a cada requisição à API Memed.
 *
 * @param doctorId - ID do médico no sistema
 * @param options - identifier/identifierType opcionais (senão, inferidos do médico)
 */
export async function getFreshPrescriberToken(
  doctorId: string,
  options?: {
    identifier?: string
    identifierType?: 'cpf' | 'external_id' | 'board'
  },
): Promise<GetFreshPrescriberTokenResult> {
  await getAdminApp()

  const { user: doctor } = await getUserDoc(doctorId)

  if (!doctor) {
    return { success: false, error: 'Médico não encontrado' }
  }

  // credentialState = UF do CRM (estado do conselho). state = estado de moradia do médico.
  const credentialStateUF = (doctor.credentialState || '')
    .toString()
    .toUpperCase()

  let finalIdentifier = options?.identifier
  let finalIdentifierType = options?.identifierType || 'board'

  if (!finalIdentifier) {
    // Board (CRM+UF) é o identificador canônico da Memed — prioridade máxima.
    // external_id (Firebase UID como path param) pode não ser reconhecido em todos os
    // endpoints da Memed; use-o apenas como fallback.
    if (doctor.credential && credentialStateUF) {
      finalIdentifier = `${doctor.credential.replace(/\D/g, '')}${credentialStateUF}`
      finalIdentifierType = 'board'
    } else if (doctor.id) {
      finalIdentifier = doctor.id
      finalIdentifierType = 'external_id'
    } else if (doctor.cpf) {
      finalIdentifier = doctor.cpf.replace(/\D/g, '')
      finalIdentifierType = 'cpf'
    } else {
      return {
        success: false,
        error:
          'Não foi possível identificar o médico. Forneça CPF, CRM+UF ou external_id',
      }
    }
  }

  const doctorExistsInMemed =
    !!(doctor.memedId || doctor.memedRegistered) || !!(doctor.credential && credentialStateUF)

  let result = await memedService.getPrescriberToken({
    identifier: finalIdentifier,
    identifierType: finalIdentifierType,
  })

  // Fallbacks na ordem: board → external_id → cpf
  if ((result.error || !result.token) && !options?.identifier) {
    if (finalIdentifierType === 'board' && doctor.id) {
      // Tenta external_id como segundo recurso
      result = await memedService.getPrescriberToken({
        identifier: doctor.id,
        identifierType: 'external_id',
      })
    }

    if ((result.error || !result.token) && doctor.cpf) {
      // Tenta CPF como último recurso
      result = await memedService.getPrescriberToken({
        identifier: doctor.cpf.replace(/\D/g, ''),
        identifierType: 'cpf',
      })
    }
  }

  if (result.error || !result.token) {
    let errorMessage = result.error || 'Token não encontrado na Memed'

    const isAuthError =
      result.error?.includes('403') ||
      result.error?.includes('Forbidden') ||
      result.error?.toLowerCase().includes('código de acesso inválido') ||
      result.error?.toLowerCase().includes('codigo de acesso invalido')

    if (isAuthError) {
      if (!doctorExistsInMemed) {
        errorMessage =
          'Médico não encontrado na Memed. É necessário cadastrar o médico na plataforma Memed antes de poder prescrever. Entre em contato com o suporte para realizar o cadastro.'
      } else {
        errorMessage =
          'Acesso negado pela Memed. Verifique se as credenciais da API (api-key/secret-key) estão corretas para o ambiente integrations.api.memed.com.br.'
      }
    }

    return {
      success: false,
      error: errorMessage,
      doctorNotRegistered: !doctorExistsInMemed,
    }
  }

  return { success: true, token: result.token }
}
