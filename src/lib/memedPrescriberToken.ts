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
    !!(doctor.memedId || doctor.memedRegistered) ||
    !!(doctor.credential && credentialStateUF)

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
    // ─── Último recurso: tentar (re)registrar na Memed ──────────────────────
    // Cobre o caso onde memedRegistered:true mas sem memedId (registro incompleto
    // ou com board_code errado). Agora tenta novamente com credentialType correto.
    if (!options?.identifier && doctor.credential && credentialStateUF) {
      const nameParts = (doctor.name || '').trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const surname = nameParts.slice(1).join(' ') || firstName

      const regResult = await memedService.registerDoctor({
        externalId: doctorId,
        name: firstName,
        surname,
        email: doctor.email ? String(doctor.email) : undefined,
        cpf: doctor.cpf ? String(doctor.cpf).replace(/\D/g, '') : undefined,
        crm: doctor.credential.replace(/\D/g, ''),
        crmState: credentialStateUF,
        credentialType: String(doctor.typeOfCredential || 'CRM'),
      })

      if (regResult.success) {
        // Persistir memedId no Firestore para lookups futuros
        if (regResult.memedId) {
          try {
            const { adminFirestore } = await import(
              '@/config/firebase/firebaseAdmin'
            )
            await adminFirestore()
              .collection('users')
              .doc(doctorId)
              .update({
                memedId: regResult.memedId,
                memedRegistered: true,
                updatedAt: new Date(),
              })
          } catch {
            // não-fatal: salvar memedId é opcional aqui
          }
        }

        // Se o registro retornou o token diretamente, usa ele
        if (regResult.prescriberToken) {
          return { success: true, token: regResult.prescriberToken }
        }

        // Senão, busca token via external_id (recém registrado com doctorId)
        const tokenAfterReg = await memedService.getPrescriberToken({
          identifier: doctorId,
          identifierType: 'external_id',
        })
        if (!tokenAfterReg.error && tokenAfterReg.token) {
          return { success: true, token: tokenAfterReg.token }
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    let errorMessage = result.error || 'Token não encontrado na Memed'

    const isAuthError =
      result.error?.includes('403') ||
      result.error?.includes('Forbidden') ||
      result.error?.toLowerCase().includes('código de acesso inválido') ||
      result.error?.toLowerCase().includes('codigo de acesso invalido')

    const isNotFoundError =
      result.error?.includes('404') ||
      result.error?.toLowerCase().includes('nenhum usuário') ||
      result.error?.toLowerCase().includes('nenhum usuario') ||
      result.error?.toLowerCase().includes('não encontrado')

    if (isNotFoundError) {
      // Se o médico tem credencial + UF ou já foi marcado como registrado no Memed,
      // não afirmamos que ele "não está cadastrado" — pode ser mismatch de identificador.
      if (doctorExistsInMemed) {
        return {
          success: false,
          error:
            'Não foi possível obter o token Memed. Verifique se o número de credencial e a UF estão corretos no cadastro, ou entre em contato com o suporte.',
          doctorNotRegistered: false,
        }
      }
      return {
        success: false,
        error:
          'Médico não cadastrado na Memed. É necessário realizar o cadastro antes de prescrever. Entre em contato com o suporte.',
        doctorNotRegistered: true,
      }
    }

    if (isAuthError) {
      if (!doctorExistsInMemed) {
        errorMessage =
          'Médico não encontrado na Memed. É necessário cadastrar o médico na plataforma Memed antes de poder prescrever. Entre em contato com o suporte para realizar o cadastro.'
      } else {
        errorMessage =
          'Acesso negado pela Memed. Verifique se as credenciais da API (api-key/secret-key) estão corretas.'
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
