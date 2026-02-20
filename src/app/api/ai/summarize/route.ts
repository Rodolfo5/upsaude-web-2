/**
 * 🤖 API DE GERAÇÃO DE SUMÁRIO COM IA
 *
 * Endpoint para gerar sumário clínico a partir da transcrição de uma consulta.
 * Utiliza Vertex AI (Gemini) para análise.
 *
 * Fluxo:
 * 1. Recebe consultationId
 * 2. Busca audioTranscription no Firestore
 * 3. Chama Vertex AI para gerar sumário
 * 4. Salva sumário no Firestore
 * 5. Retorna sumário gerado
 *
 * ⚠️ IMPORTANTE:
 * - Requer biblioteca @google-cloud/vertexai instalada
 * - Requer credenciais do Google Cloud configuradas
 * - Só funciona para consultas que já possuem audioTranscription
 */

import { NextResponse } from 'next/server'

import { adminFirestore, getAdminApp } from '@/config/firebase/firebaseAdmin'
import { generateClinicalSummary } from '@/services/aiSummary'

// ====================================================================
// 📋 TIPOS
// ====================================================================

/**
 * Dados de entrada para geração de sumário
 */
interface SummarizeRequest {
  consultationId: string
}

/**
 * Resposta da API
 */
interface SummarizeResponse {
  success: boolean
  error?: string
  aiSummary?: string
}

// ====================================================================
// 🚀 HANDLER POST
// ====================================================================

export async function POST(
  request: Request,
): Promise<NextResponse<SummarizeResponse>> {
  try {
    const body = (await request.json()) as SummarizeRequest

    const { consultationId } = body

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

    console.log(
      `Iniciando geração de sumário para a consulta ${consultationId}`,
    )

    // Buscar consulta no Firestore
    await getAdminApp()
    const db = adminFirestore()
    const consultationRef = db.collection('consultations').doc(consultationId)
    const consultationSnap = await consultationRef.get()

    if (!consultationSnap.exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Consulta não encontrada',
        },
        { status: 404 },
      )
    }

    const consultationData = consultationSnap.data() as {
      audioTranscription?: string
      status?: string
    }

    // Verificar se há transcrição
    const transcription = consultationData.audioTranscription?.trim()

    if (!transcription) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Consulta não possui transcrição de áudio. Certifique-se de que a transcrição foi gerada antes de solicitar o sumário.',
        },
        { status: 400 },
      )
    }

    console.log(
      `Transcrição encontrada (${transcription.length} caracteres). Gerando sumário...`,
    )

    // Gerar sumário com IA
    const result = await generateClinicalSummary(transcription)

    if (result.error || !result.summary) {
      console.error(`Erro ao gerar sumário: ${result.error}`)

      return NextResponse.json(
        {
          success: false,
          error: result.error ?? 'Não foi possível gerar o sumário da consulta',
        },
        { status: 500 },
      )
    }

    // Salvar sumário no Firestore
    await consultationRef.set(
      {
        aiSummary: result.summary,
        aiSummaryUpdatedAt: new Date(),
        aiSummaryModel: process.env.VERTEX_MODEL || 'gemini-2.5-flash-lite',
      },
      { merge: true },
    )

    console.log(
      `Sumário gerado e salvo com sucesso para consulta ${consultationId}`,
    )

    return NextResponse.json({
      success: true,
      aiSummary: result.summary,
    })
  } catch (error) {
    console.error('Erro na API de geração de sumário:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao processar geração de sumário',
      },
      { status: 500 },
    )
  }
}
