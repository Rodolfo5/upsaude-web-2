import { NextResponse } from 'next/server'

import { memedService } from '@/services/memed'

/**
 * GET /api/memed/get-prescriptions
 *
 * Busca o histórico de prescrições de um prescritor via API Memed
 *
 * Query params:
 * - prescriberToken: Token do prescritor (obrigatório)
 * - limit: Número máximo de prescrições a retornar (opcional)
 *
 * Resposta:
 * {
 *   success: boolean
 *   prescriptions?: MemedPrescription[]
 *   error?: string
 * }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const prescriberToken = searchParams.get('prescriberToken')
    const limitParam = searchParams.get('limit')

    if (!prescriberToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token do prescritor é obrigatório',
        },
        { status: 400 },
      )
    }

    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    const result = await memedService.getPrescriberPrescriptions(
      prescriberToken,
      limit,
    )

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Erro ao buscar histórico de prescrições',
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      prescriptions: result.prescriptions || [],
    })
  } catch (error) {
    console.error('❌ Erro na rota get-prescriptions:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao buscar histórico de prescrições',
      },
      { status: 500 },
    )
  }
}
