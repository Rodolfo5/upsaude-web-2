import { NextResponse } from 'next/server'

import { memedService } from '@/services/memed'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { crm, crmState, externalId, cpf } = body

    if (!crm && !externalId && !cpf) {
      return NextResponse.json(
        { error: 'É necessário fornecer crm+crmState, externalId ou cpf' },
        { status: 400 },
      )
    }

    const memedId = await memedService.getDoctorMemedId({
      crm,
      crmState,
      externalId,
      cpf,
    })

    if (memedId) {
      return NextResponse.json({ memedId, found: true }, { status: 200 })
    } else {
      return NextResponse.json(
        {
          memedId: null,
          found: false,
          error: 'Médico não encontrado na Memed',
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error('❌ Erro na API de busca de memedId:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    })
    return NextResponse.json(
      {
        memedId: null,
        found: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno do servidor ao buscar memedId',
      },
      { status: 500 },
    )
  }
}
