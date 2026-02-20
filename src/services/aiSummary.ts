/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 🤖 SERVIÇO DE GERAÇÃO DE SUMÁRIO COM IA
 *
 * Utiliza Vertex AI (Gemini) para gerar sumários de consultas
 * a partir de transcrições.
 *
 * Funcionalidades:
 * - Gerar sumário estruturado em Markdown
 * - Validação de entrada
 * - Tratamento de erros robusto
 *
 * ⚠️ IMPORTANTE:
 * - Requer variáveis de ambiente do Google Cloud configuradas
 * - Usar apenas em API Routes ou Server Components
 */

import { VertexAI } from '@google-cloud/vertexai'

import { getAdminApp } from '@/config/firebase/firebaseAdmin'

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined
  return key.replace(/\\n/g, '\n')
}

/**
 * Resultado da geração de sumário
 */
export interface AISummaryResult {
  summary: string | null
  error: string | null
}

/**
 * Prompt otimizado para gerar sumário clínico
 */
const CLINICAL_SUMMARY_PROMPT = `
Você é um **Assistente Clínico de IA** altamente competente. Sua tarefa é analisar a transcrição de uma consulta médica (ou terapêutica) e gerar um **Sumário Clínico Objetivo e Estruturado**. O sumário deve ser focado em informações médicas e de tratamento, **ignorando conversas não-clínicas**.

**FORMATO E ESTRUTURA REQUERIDA (Obrigatório):**
Retorne o sumário no formato **Markdown**, seguindo estritamente os subtítulos abaixo. Se uma seção não tiver informação na transcrição, marque como "Não mencionado" ou "Sem dados relevantes".

## 1. Queixa Principal (Sintomas Atuais)
[O sintoma, problema ou razão principal da visita, na voz do paciente.]

## 2. Histórico da Queixa (HMP)
[Quando começou, o que piora/melhora, tratamentos anteriores relacionados ao problema.]

## 3. Histórico Médico Pregresso (Comorbidades)
[Condições médicas prévias ou crônicas relevantes (ex: diabetes, hipertensão).]

## 4. Medicamentos em Uso
[Lista de medicamentos, doses e frequência mencionados.]

## 5. Avaliação Subjetiva do Profissional
[Impressões chave do profissional sobre o estado do paciente.]

## 6. Plano de Tratamento e Próximos Passos
[Instruções, exames solicitados, encaminhamentos e/ou medicamentos prescritos na consulta.]

**INSTRUÇÕES:**
- Seja objetivo e direto
- Use linguagem médica apropriada
- Não invente informações que não estão na transcrição
- Ignore saudações, conversas sociais e interrupções técnicas
- Foque apenas no conteúdo clínico relevante
`.trim()

/**
 * Gera sumário clínico a partir de uma transcrição
 *
 * @param transcription - Texto da transcrição da consulta
 * @returns Sumário em Markdown ou erro
 */
export async function generateClinicalSummary(
  transcription: string,
): Promise<AISummaryResult> {
  try {
    if (!transcription || !transcription.trim()) {
      return {
        summary: null,
        error: 'Transcrição vazia ou inválida',
      }
    }

    // Inicializar Vertex AI
    const adminApp = await getAdminApp()
    const projectId = adminApp.options.projectId

    if (!projectId) {
      return {
        summary: null,
        error: 'Project ID não configurado',
      }
    }

    const location = process.env.VERTEX_LOCATION || 'us-central1'
    const modelName = process.env.VERTEX_MODEL || 'gemini-2.5-flash-lite'

    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY)

    const hasServiceAccountCredentials = clientEmail && privateKey

    const vertex = new VertexAI({
      project: projectId,
      location,
      googleAuthOptions: hasServiceAccountCredentials
        ? {
            credentials: {
              client_email: clientEmail!,
              private_key: privateKey!,
            },
          }
        : undefined,
    })

    const model = vertex.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.2, // Baixa temperatura para mais precisão
        maxOutputTokens: 2048, // Suficiente para o sumário
        topP: 0.95,
        topK: 40,
      },
    })

    // Construir prompt completo
    const fullPrompt = `${CLINICAL_SUMMARY_PROMPT}

                            **TRANSCRIÇÃO DA CONSULTA:**
                            ${transcription}

                            **SUMÁRIO CLÍNICO:**
                        `

    console.log(
      `Gerando sumário com modelo ${modelName} (${transcription.length} caracteres de transcrição)`,
    )

    // Gerar sumário
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    })

    const summary =
      result.response.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .filter(Boolean)
        .join('')
        .trim() || ''

    if (!summary) {
      return {
        summary: null,
        error: 'Vertex AI retornou resposta vazia',
      }
    }

    console.log(`Sumário gerado com sucesso (${summary.length} caracteres)`)

    return {
      summary,
      error: null,
    }
  } catch (error) {
    console.error('Erro ao gerar sumário com IA:', error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Erro desconhecido ao gerar sumário'
    return {
      summary: null,
      error: errorMessage,
    }
  }
}
