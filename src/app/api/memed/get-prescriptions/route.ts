import { NextResponse } from 'next/server'

import { getFreshPrescriberToken } from '@/lib/memedPrescriberToken'
import { memedService } from '@/services/memed'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')
    const prescriberTokenParam = searchParams.get('prescriberToken')
    const limitParam = searchParams.get('limit')

    let tokenToUse: string | null = prescriberTokenParam

    if (doctorId) {
      const tokenResult = await getFreshPrescriberToken(doctorId)
      if (!tokenResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: tokenResult.error,
          },
          { status: tokenResult.error === 'Médico não encontrado' ? 404 : 400 },
        )
      }
      tokenToUse = tokenResult.token
    }

    if (!tokenToUse) {
      return NextResponse.json(
        {
          success: false,
          error:
            'É necessário enviar doctorId ou prescriberToken para obter o token válido do prescritor',
        },
        { status: 400 },
      )
    }

    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    const result = await memedService.getPrescriberPrescriptions(
      tokenToUse,
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
