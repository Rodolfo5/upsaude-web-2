import { NextResponse } from 'next/server'

import { memedService } from '@/services/memed'

/**
 * GET /api/memed/get-prescription
 *
 * Busca uma prescrição específica pelo ID via API Memed
 *
 * Query params:
 * - prescriptionId: ID da prescrição na Memed (obrigatório)
 *
 * Resposta:
 * {
 *   success: boolean
 *   prescription?: MemedPrescription
 *   error?: string
 * }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const prescriptionId = searchParams.get('prescriptionId')
    const prescriberToken = searchParams.get('prescriberToken')

    if (!prescriptionId) {
      console.error('❌ API Route - ID da prescrição não fornecido')
      return NextResponse.json(
        {
          success: false,
          error: 'ID da prescrição é obrigatório',
        },
        { status: 400 },
      )
    }

    if (!prescriberToken) {
      console.warn(
        '⚠️ API Route - Token do prescritor não fornecido, tentando com api-key/secret',
      )
    }

    const result = await memedService.getPrescription(
      prescriptionId,
      prescriberToken || undefined,
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
