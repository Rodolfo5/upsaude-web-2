import { NextResponse } from 'next/server'

import { getAdminApp } from '@/config/firebase/firebaseAdmin'
import { memedService } from '@/services/memed'
import { getUserDoc } from '@/services/user'

/**
 * API Route para obter o token de acesso do usuário prescritor
 *
 * Obtém o token do prescritor da API Memed usando:
 * - CPF, external_id, ou registro+UF como identificador
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { doctorId, identifier, identifierType } = body

    if (!doctorId) {
      return NextResponse.json(
        { error: 'ID do médico é obrigatório' },
        { status: 400 },
      )
    }

    await getAdminApp()

    const { user: doctor } = await getUserDoc(doctorId)

    if (!doctor) {
      return NextResponse.json(
        { error: 'Médico não encontrado' },
        { status: 404 },
      )
    }

    if (doctor.token && doctor.token.length > 0) {
      return NextResponse.json(
        {
          token: doctor.token,
          doctorId,
          source: 'firestore',
        },
        { status: 200 },
      )
    }

    let finalIdentifier = identifier
    let finalIdentifierType = identifierType || 'board'

    if (!finalIdentifier) {
      if ((doctor.memedId || doctor.memedRegistered) && doctor.id) {
        finalIdentifier = doctor.id
        finalIdentifierType = 'external_id'
      } else if (doctor.credential && doctor.state) {
        finalIdentifier = `${doctor.credential.replace(/\D/g, '')}${doctor.state.toUpperCase()}`
        finalIdentifierType = 'board'
      } else if (doctor.id) {
        finalIdentifier = doctor.id
        finalIdentifierType = 'external_id'
      } else if (doctor.cpf) {
        finalIdentifier = doctor.cpf.replace(/\D/g, '')
        finalIdentifierType = 'cpf'
      } else {
        return NextResponse.json(
          {
            error:
              'Não foi possível identificar o médico. Forneça CPF, CRM+UF ou external_id',
          },
          { status: 400 },
        )
      }
    }

    let doctorExistsInMemed = false

    if (doctor.memedId || doctor.memedRegistered) {
      doctorExistsInMemed = true
    } else if (doctor.credential && doctor.state) {
      try {
        const crmValidation = await memedService.validateCrm({
          crm: doctor.credential,
          crmState: doctor.state,
        })
        doctorExistsInMemed = crmValidation.valid
      } catch {
        // Continua mesmo se a validação falhar
      }
    }

    let result = await memedService.getPrescriberToken({
      identifier: finalIdentifier,
      identifierType: finalIdentifierType as 'cpf' | 'external_id' | 'board',
    })

    // Se falhar e tivermos outras opções, tenta fallback
    if ((result.error || !result.token) && !identifier) {
      // Se tentou board e falhou, tenta external_id
      if (
        finalIdentifierType === 'board' &&
        doctor.id &&
        (doctor.memedId || doctor.memedRegistered)
      ) {
        result = await memedService.getPrescriberToken({
          identifier: doctor.id,
          identifierType: 'external_id',
        })
      }
      // Se tentou external_id e falhou, tenta board
      else if (
        finalIdentifierType === 'external_id' &&
        doctor.credential &&
        doctor.state
      ) {
        const boardIdentifier = `${doctor.credential.replace(/\D/g, '')}${doctor.state.toUpperCase()}`
        result = await memedService.getPrescriberToken({
          identifier: boardIdentifier,
          identifierType: 'board',
        })
      }
    }

    if (result.error || !result.token) {
      // Mensagem mais específica baseada no erro
      let errorMessage = result.error || 'Token não encontrado na Memed'

      // Se o erro contém "403" ou "Forbidden", sugere que o médico pode não estar cadastrado
      if (
        result.error?.includes('403') ||
        result.error?.includes('Forbidden')
      ) {
        if (!doctorExistsInMemed) {
          errorMessage =
            'Médico não encontrado na Memed. É necessário cadastrar o médico na plataforma Memed antes de poder prescrever. Entre em contato com o suporte para realizar o cadastro.'
        } else {
          errorMessage =
            'Acesso negado pela Memed. Verifique se as credenciais da API estão corretas ou entre em contato com o suporte.'
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
          doctorNotRegistered: !doctorExistsInMemed,
        },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        token: result.token,
        doctorId,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Erro ao obter token do prescritor:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao obter token do prescritor',
      },
      { status: 500 },
    )
  }
}
