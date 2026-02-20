import { NextResponse } from 'next/server'

import { memedService } from '@/services/memed'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { externalId } = body

    if (!externalId) {
      return NextResponse.json(
        { error: 'externalId é obrigatório' },
        { status: 400 },
      )
    }

    const result = await memedService.checkDoctorExists(externalId)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('❌ Erro na API de verificação de médico:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    })
    return NextResponse.json(
      {
        exists: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno do servidor ao verificar médico',
      },
      { status: 500 },
    )
  }
}
