/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 🤖 SERVIÇO DE GERAÇÃO DE PLANO TERAPÊUTICO COM IA
 *
 * Utiliza Vertex AI (Gemini) para gerar planos terapêuticos personalizados
 * a partir de dados do checkup digital do paciente.
 *
 * Funcionalidades:
 * - Gerar metas, atividades e orientações para Saúde Mental
 * - Gerar metas e atividades para Biomarcadores de Saúde
 * - Gerar categorias e atividades para Estilo de Vida
 * - Resposta estruturada em JSON
 *
 * ⚠️ IMPORTANTE:
 * - Requer variáveis de ambiente do Google Cloud configuradas
 * - Usar apenas em API Routes ou Server Components
 */

import { VertexAI } from '@google-cloud/vertexai'

import { getAdminApp } from '@/config/firebase/firebaseAdmin'
import type { HealthCheckupEntity } from '@/types/entities/healthCheckup'
import { formatCheckupForPrompt } from '@/utils/checkup/checkupToPrompt'

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined
  return key.replace(/\\n/g, '\n')
}

/**
 * Resposta estruturada da IA para geração de plano
 */
export interface AIHealthPlanResponse {
  mentalHealth: {
    goals: Array<{
      type: 'Qualidade de Sono' | 'Estresse' | 'Humor'
      desiredParameter: string // Obrigatório: meta mensurável (ex: "Dormir 7-8h por noite")
      activities: Array<{
        name: string
        description?: string
        frequency: string // Obrigatório (ex: "Diariamente", "3x/semana")
        deadlineValue?: string
        deadlineUnit?: string // "Dia" | "Semana" | "Mês"
      }>
      orientations: Array<{
        title: string
        description?: string
      }>
    }>
  }
  biomarkers: {
    goals: Array<{
      name: string
      desiredParameter?: string
      activities: Array<{
        name: string
        description?: string
        frequency?: string
        deadlineValue?: string
        deadlineUnit?: string
      }>
      orientations: Array<{
        title: string
        description?: string
      }>
    }>
  }
  lifestyle: {
    categories: Array<{
      type:
        | 'Hidratação'
        | 'Peso'
        | 'Movimentos - Passos'
        | 'Movimentos - Gasto Calórico'
        | 'Alimentação'
      desiredParameter?: number | string // number para Passos/kcal/Peso/Hidratação; string para Alimentação (meta textual)
      activities: Array<{
        name: string
        description?: string
        frequency: string // Obrigatório (ex: "3x Semana", "Diariamente")
      }>
      orientations: Array<{
        area?: string
        title: string
        description?: string
      }>
    }>
  }
  reasoning: string
}

/**
 * Resultado da geração de plano
 */
export interface AIHealthPlanResult {
  plan: AIHealthPlanResponse | null
  error: string | null
}

/**
 * Prompt otimizado para gerar plano terapêutico
 */
const HEALTH_PLAN_PROMPT = `
Você é um **Assistente Clínico de IA** especializado em medicina preventiva e planos terapêuticos personalizados. Sua tarefa é analisar o checkup digital deste paciente e gerar um plano terapêutico inicial estruturado e baseado em evidências científicas.

**INSTRUÇÕES CRÍTICAS:**

1. **Saúde Mental**
   - Crie 1-3 metas baseadas nos scores PHQ-9, GAD-7 e qualidade de sono. Tipos permitidos: "Qualidade de Sono", "Estresse", "Humor".
   - **Toda meta DEVE ter "desiredParameter"**: meta mensurável e clara (ex: "Dormir 7-8 horas por noite", "Reduzir sintomas de ansiedade em 50% em 3 meses").
   - **Toda atividade DEVE ter**: "name", "description" (detalhando o que fazer), "frequency" (ex: "Diariamente", "3x/semana"). Quando fizer sentido, inclua "deadlineValue" e "deadlineUnit" ("Dia", "Semana" ou "Mês") para dar prazo à atividade.
   - Para cada meta: 2-3 atividades práticas (sempre com parâmetros acima) e 1-2 orientações educativas.

2. **Biomarcadores de Saúde**
   - Identifique riscos cardiometabólicos (hipertensão, diabetes, colesterol, obesidade) e crie 1-3 metas específicas. Se houver dado de pressão arterial, inclua obrigatoriamente meta de pressão arterial.
   - Para cada meta: atividades de monitoramento com "frequency", "deadlineValue" e "deadlineUnit" quando aplicável; orientações sobre o biomarcador.

3. **Estilo de Vida**
   - **Movimentos**: Use EXATAMENTE os tipos "Movimentos - Passos" e/ou "Movimentos - Gasto Calórico". NUNCA use apenas "Movimentos".
     - "Movimentos - Passos": "desiredParameter" deve ser um NÚMERO (ex: 8000 ou 10000) indicando meta de passos por dia.
     - "Movimentos - Gasto Calórico": "desiredParameter" deve ser um NÚMERO (ex: 200 ou 300) indicando meta de gasto calórico em kcal por dia ou por semana, conforme o contexto.
     - Para cada categoria de movimento: 2-3 atividades com "name", "description" (como alcançar a meta) e "frequency" (ex: "5x Semana", "Diariamente").
   - **Alimentação**: Categoria com "type": "Alimentação". "desiredParameter" deve ser uma STRING com a meta alimentar (ex: "Aumentar consumo de fibras e reduzir ultraprocessados"). Inclua 2-3 atividades concretas (name, description, frequency) e 1-2 orientações (area: "Alimentação", title, description).
   - Inclua também categorias Hidratação e Peso quando relevante, com desiredParameter numérico e atividades completas.

4. **Princípios**
   - Use linguagem clara, empática e voltada ao paciente.
   - Atividades devem ser factíveis, específicas e sempre com frequência e, quando cabível, prazo.
   - Orientações devem ser educativas e baseadas em evidências.
   - Limite a 2-3 metas por pilar e 2-4 categorias de estilo de vida para não sobrecarregar.
   - Priorize problemas identificados na classificação de risco.

5. **Formato de Resposta**: Retorne APENAS um JSON válido, sem markdown, sem texto adicional. O JSON deve seguir exatamente esta estrutura (inclua exemplos de Movimentos e Alimentação completos):

{
  "mentalHealth": {
    "goals": [
      {
        "type": "Qualidade de Sono",
        "desiredParameter": "Dormir 7-8 horas por noite",
        "activities": [
          {
            "name": "Estabelecer rotina de sono",
            "description": "Ir para cama e acordar no mesmo horário todos os dias, inclusive fins de semana",
            "frequency": "Diariamente",
            "deadlineValue": "4",
            "deadlineUnit": "Semana"
          },
          {
            "name": "Registro de horários de sono",
            "description": "Anotar hora de deitar e de levantar para ajustar a rotina",
            "frequency": "Diariamente"
          }
        ],
        "orientations": [
          {
            "title": "Higiene do sono",
            "description": "Evitar telas 1h antes de dormir, manter ambiente escuro e silencioso"
          }
        ]
      }
    ]
  },
  "biomarkers": {
    "goals": [
      {
        "name": "Controlar Pressão Arterial",
        "desiredParameter": "Manter abaixo de 140/90 mmHg",
        "activities": [
          {
            "name": "Aferir pressão arterial",
            "description": "Medir pressão 3 vezes por semana, pela manhã, em repouso",
            "frequency": "3x/semana",
            "deadlineValue": "3",
            "deadlineUnit": "Mês"
          }
        ],
        "orientations": [
          {
            "title": "Redução de sódio",
            "description": "Limitar consumo de sal a menos de 5g por dia"
          }
        ]
      }
    ]
  },
  "lifestyle": {
    "categories": [
      {
        "type": "Movimentos - Passos",
        "desiredParameter": 8000,
        "activities": [
          {
            "name": "Caminhada diária",
            "description": "Caminhar pelo menos 30 minutos por dia, buscando atingir a meta de passos",
            "frequency": "Diariamente"
          },
          {
            "name": "Subir escadas",
            "description": "Preferir escadas ao elevador quando possível para aumentar passos",
            "frequency": "5x Semana"
          }
        ],
        "orientations": [
          {
            "area": "Movimentos",
            "title": "Benefícios da caminhada",
            "description": "Caminhada regular melhora saúde cardiovascular e humor; use app ou relógio para contar passos"
          }
        ]
      },
      {
        "type": "Movimentos - Gasto Calórico",
        "desiredParameter": 250,
        "activities": [
          {
            "name": "Atividade aeróbica moderada",
            "description": "Ciclismo, natação ou caminhada rápida para gastar calorias diárias",
            "frequency": "4x Semana"
          }
        ],
        "orientations": [
          {
            "area": "Movimentos",
            "title": "Gasto calórico",
            "description": "Meta de 200-300 kcal/dia em atividade ajuda no equilíbrio energético"
          }
        ]
      },
      {
        "type": "Alimentação",
        "desiredParameter": "Aumentar consumo de alimentos in natura e reduzir ultraprocessados",
        "activities": [
          {
            "name": "Incluir 5 porções de frutas e verduras",
            "description": "Adicionar frutas no café da manhã e salada no almoço e jantar",
            "frequency": "Diariamente"
          },
          {
            "name": "Trocar um snack industrial por fruta ou oleaginosas",
            "description": "Substituir biscoitos ou salgadinhos por uma porção de fruta ou castanhas",
            "frequency": "Diariamente"
          }
        ],
        "orientations": [
          {
            "area": "Alimentação",
            "title": "Pirâmide alimentar",
            "description": "Priorizar base da pirâmide: grãos integrais, frutas, verduras e legumes"
          }
        ]
      }
    ]
  },
  "reasoning": "Breve explicação das recomendações baseadas nos dados do checkup"
}

IMPORTANTE: Retorne apenas o JSON, sem markdown, sem código, sem explicações adicionais. Todas as atividades devem ter "frequency". Metas de saúde mental devem ter "desiredParameter". Categorias de movimento devem usar exatamente "Movimentos - Passos" ou "Movimentos - Gasto Calórico" com desiredParameter numérico.
`.trim()

/**
 * Gera plano terapêutico a partir de dados do checkup
 *
 * @param checkup - Dados completos do checkup digital
 * @returns Plano estruturado ou erro
 */
export async function generateHealthPlan(
  checkup: HealthCheckupEntity,
): Promise<AIHealthPlanResult> {
  try {
    if (!checkup || checkup.status !== 'COMPLETED') {
      return {
        plan: null,
        error: 'Checkup não está completo ou é inválido',
      }
    }

    // Inicializar Vertex AI
    const adminApp = await getAdminApp()
    const projectId = adminApp.options.projectId

    if (!projectId) {
      return {
        plan: null,
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
        temperature: 0.3, // Temperatura moderada para balancear criatividade e precisão
        maxOutputTokens: 4096, // Maior para plano completo
        topP: 0.95,
        topK: 40,
        responseMimeType: 'application/json', // Forçar resposta JSON
      },
    })

    // Formatar dados do checkup para o prompt
    const checkupData = formatCheckupForPrompt(checkup)

    // Construir prompt completo
    const fullPrompt = `${HEALTH_PLAN_PROMPT}

**DADOS DO CHECKUP:**
${checkupData}

**PLANO TERAPÊUTICO (JSON):**
`

    console.log(
      `Gerando plano terapêutico com modelo ${modelName} para checkup ${checkup.id}`,
    )

    // Gerar plano
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    })

    const responseText =
      result.response.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .filter(Boolean)
        .join('')
        .trim() || ''

    if (!responseText) {
      return {
        plan: null,
        error: 'Vertex AI retornou resposta vazia',
      }
    }

    // Parse JSON response
    let parsedResponse: AIHealthPlanResponse
    try {
      // Remover markdown code blocks se existirem
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      parsedResponse = JSON.parse(cleanedText) as AIHealthPlanResponse
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta JSON:', parseError)
      console.error('Resposta recebida:', responseText.substring(0, 500))
      return {
        plan: null,
        error: `Erro ao processar resposta da IA: ${parseError instanceof Error ? parseError.message : 'Formato JSON inválido'}`,
      }
    }

    // Validar estrutura básica
    if (
      !parsedResponse.mentalHealth ||
      !parsedResponse.biomarkers ||
      !parsedResponse.lifestyle
    ) {
      return {
        plan: null,
        error: 'Resposta da IA não contém estrutura esperada',
      }
    }

    console.log(
      `Plano gerado com sucesso: ${parsedResponse.mentalHealth.goals.length} metas de saúde mental, ${parsedResponse.biomarkers.goals.length} metas de biomarcadores, ${parsedResponse.lifestyle.categories.length} categorias de estilo de vida`,
    )

    return {
      plan: parsedResponse,
      error: null,
    }
  } catch (error) {
    console.error('Erro ao gerar plano terapêutico com IA:', error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Erro desconhecido ao gerar plano terapêutico'
    return {
      plan: null,
      error: errorMessage,
    }
  }
}
