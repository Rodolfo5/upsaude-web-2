import { NextResponse } from 'next/server'

import { getFreshPrescriberToken } from '@/lib/memedPrescriberToken'

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

    const result = await getFreshPrescriberToken(doctorId, {
      identifier,
      identifierType: identifierType as
        | 'cpf'
        | 'external_id'
        | 'board'
        | undefined,
    })

    // Deriva o ambiente a partir da MEMED_API_URL do servidor,
    // para que o frontend use o mesmo ambiente no script data-env
    const apiUrl = process.env.MEMED_API_URL || ''
    const memedEnv = apiUrl.includes('integrations') ? 'integrations' : 'production'

    if (!result.success) {
      const status = result.error === 'Médico não encontrado' ? 404 : 400
      return NextResponse.json(
        {
          error: result.error,
          doctorNotRegistered: result.doctorNotRegistered,
        },
        { status },
      )
    }

    return NextResponse.json(
      {
        token: result.token,
        doctorId,
        memedEnv,
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
