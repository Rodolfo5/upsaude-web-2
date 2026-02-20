/**
 * 🎤 API DE TRANSCRIÇÃO DE ÁUDIO
 *
 * Endpoint para transcrever áudio usando Google Speech-to-Text API.
 * Processa a transcrição assim que o upload do áudio é concluído.
 *
 * Fluxo:
 * 1. Recebe consultationId e audioUrl
 * 2. Chama serviço de transcrição
 * 3. Salva resultado no Firestore
 * 4. Retorna sucesso/erro
 *
 * ⚠️ IMPORTANTE:
 * - Responde apenas após concluir a transcrição
 * - Se transcrição falhar, não afeta a consulta
 * - Requer biblioteca @google-cloud/speech instalada
 */

import { NextResponse } from 'next/server'

import { updateConsultationTranscription } from '@/services/consultation'
import { transcribeAudioFromUrl } from '@/services/transcription'

// ====================================================================
// 📋 TIPOS
// ====================================================================

/**
 * Dados de entrada para transcrição
 */
interface TranscribeRequest {
  consultationId: string
  audioUrl: string
  audioChannelCount?: number
}

/**
 * Resposta da API
 */
interface TranscribeResponse {
  success: boolean
  error?: string
  transcription?: string
}

// ====================================================================
// 🚀 HANDLER POST
// ====================================================================

export async function POST(
  request: Request,
): Promise<NextResponse<TranscribeResponse>> {
  try {
    const body = (await request.json()) as TranscribeRequest

    const { consultationId, audioUrl, audioChannelCount } = body

    // Validação
    if (!consultationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID da consulta é obrigatório',
        },
        { status: 400 },
      )
    }

    if (!audioUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'URL do áudio é obrigatória',
        },
        { status: 400 },
      )
    }

    console.log(
      `Iniciando transcrição síncrona para a consulta ${consultationId}`,
    )

    const result = await transcribeAudioFromUrl(audioUrl, {
      audioChannelCount,
    })

    if (result.error || !result.transcription) {
      console.error(
        `Erro ao transcrever áudio para consulta ${consultationId}:`,
        result.error,
      )

      return NextResponse.json(
        {
          success: false,
          error:
            result.error ??
            'Não foi possível gerar a transcrição do áudio desta consulta',
        },
        { status: 500 },
      )
    }

    const updateResult = await updateConsultationTranscription(
      consultationId,
      result.transcription,
    )

    if (!updateResult.success) {
      console.error(
        `Erro ao salvar transcrição para consulta ${consultationId}:`,
        updateResult.error,
      )

      return NextResponse.json(
        {
          success: false,
          error:
            updateResult.error ??
            'Falha ao salvar a transcrição da consulta no banco de dados',
        },
        { status: 500 },
      )
    }

    console.log(
      `Transcrição salva com sucesso para consulta ${consultationId}. Tamanho: ${result.transcription.length} caracteres`,
    )

    return NextResponse.json({
      success: true,
      transcription: result.transcription,
    })
  } catch (error) {
    console.error('Erro na API de transcrição:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao processar transcrição',
      },
      { status: 500 },
    )
  }
}
