import { NextResponse } from 'next/server'

import { getFreshPrescriberToken } from '@/lib/memedPrescriberToken'
import { memedService } from '@/services/memed'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const prescriptionId = searchParams.get('prescriptionId')
    const doctorId = searchParams.get('doctorId')
    const prescriberTokenParam = searchParams.get('prescriberToken')

    if (!prescriptionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID da prescrição é obrigatório',
        },
        { status: 400 },
      )
    }

    let tokenToUse = prescriberTokenParam

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
    } else if (!tokenToUse) {
      console.warn(
        '⚠️ get-prescription: doctorId ou prescriberToken não fornecido, tentando com api-key/secret',
      )
    }

    const result = await memedService.getPrescription(
      prescriptionId,
      tokenToUse || undefined,
    )

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Erro ao buscar prescrição',
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      prescription: result.prescription,
    })
  } catch (error) {
    console.error('❌ Erro na rota get-prescription:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erro ao buscar prescrição',
      },
      { status: 500 },
    )
  }
}
