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
 * Parâmetro de meta de peso (usado no WeightGoalModal)
 */
export interface WeightGoalParameter {
  currentWeight: number // Peso atual em kg (do checkup)
  objective: 'Ganhar' | 'Perder'
  quantity: number // Quantidade de kg a ganhar/perder
  deadline: number // Valor numérico do prazo
  deadlineUnit: 'Dias' | 'Semanas' | 'Meses'
  patientGuidelines?: string
}

/**
 * Resposta estruturada da IA para geração de plano
 */
export interface AIHealthPlanResponse {
  mentalHealth: {
    goals: Array<{
      type: 'Qualidade de Sono' | 'Estresse' | 'Humor'
      /**
       * - Qualidade de Sono: NUMBER de horas (ex: 8)
       * - Estresse: exatamente "baixo" | "moderado" | "alto"
       * - Humor: exatamente "ruim" | "intermediário" | "bom"
       */
      desiredParameter:
        | number
        | 'baixo'
        | 'moderado'
        | 'alto'
        | 'ruim'
        | 'intermediário'
        | 'bom'
      activities: Array<{
        name: string
        description?: string
        frequency: string // ex: "Diariamente", "3x/semana"
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
        description?: string // Orientações ao paciente sobre como realizar a medição
        /**
         * Valor numérico da frequência como string: "1" | "2" | "3" | "4" | "5" | "6" | "7"
         */
        frequencyValue: string
        /**
         * Unidade da frequência: exatamente "Dia" | "Semana" | "Mês"
         */
        frequencyUnit: 'Dia' | 'Semana' | 'Mês'
        /**
         * Valor do prazo como string: "1" a "12"
         */
        deadlineValue?: string
        /**
         * Unidade do prazo: exatamente "Dia" | "Semana" | "Mês"
         */
        deadlineUnit?: 'Dia' | 'Semana' | 'Mês'
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
      /**
       * - Hidratação: NUMBER (litros/dia, ex: 2)
       * - Peso: OBJETO WeightGoalParameter
       * - Movimentos - Passos: NUMBER (passos/dia, ex: 8000)
       * - Movimentos - Gasto Calórico: NUMBER (kcal/dia, ex: 250)
       * - Alimentação: STRING com meta textual
       */
      desiredParameter?: number | string | WeightGoalParameter
      activities: Array<{
        name: string
        description?: string
        frequency: string // ex: "Diariamente", "5x Semana"
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

**INSTRUÇÕES CRÍTICAS — LEIA COM ATENÇÃO ANTES DE GERAR O JSON:**

---

## 1. SAÚDE MENTAL

- Crie 1-3 metas. Tipos permitidos: "Qualidade de Sono", "Estresse", "Humor".
- **"desiredParameter" tem formato DIFERENTE para cada tipo — siga exatamente:**
  - Tipo **"Qualidade de Sono"**: "desiredParameter" deve ser um **NÚMERO INTEIRO** representando as horas de sono desejadas (ex: 8). NÃO use texto.
  - Tipo **"Estresse"**: "desiredParameter" deve ser EXATAMENTE uma dessas strings: **"baixo"**, **"moderado"** ou **"alto"**. NÃO use texto livre.
  - Tipo **"Humor"**: "desiredParameter" deve ser EXATAMENTE uma dessas strings: **"ruim"**, **"intermediário"** ou **"bom"**. NÃO use texto livre.
- Cada atividade DEVE ter: "name", "description" (o que fazer detalhado), "frequency" (ex: "Diariamente", "3x/semana"). Opcionalmente: "deadlineValue" (string "1"-"12") e "deadlineUnit" ("Dia", "Semana" ou "Mês").
- Para cada meta: 2-3 atividades práticas e 1-2 orientações educativas.

---

## 2. BIOMARCADORES DE SAÚDE

- Identifique riscos cardiometabólicos (hipertensão, diabetes, colesterol, obesidade) e crie 1-3 metas. Se houver pressão arterial nos dados, inclua meta de pressão arterial obrigatoriamente.
- **Atividades de biomarcadores têm formato ESPECIAL de frequência — siga exatamente:**
  - **"frequencyValue"**: string com APENAS um número de 1 a 7 (ex: "1", "2", "3"). NÃO inclua "x" ou unidade aqui.
  - **"frequencyUnit"**: EXATAMENTE uma dessas strings: **"Dia"**, **"Semana"** ou **"Mês"**. Maiúscula inicial.
  - **"deadlineValue"**: string com número de 1 a 12 (ex: "3", "6"). Obrigatório.
  - **"deadlineUnit"**: EXATAMENTE uma dessas strings: **"Dia"**, **"Semana"** ou **"Mês"**. Maiúscula inicial.
  - **"description"**: orientações ao paciente sobre COMO realizar a medição (ex: "Medir em repouso, 30 minutos após acordar, anote os valores").
  - NÃO use o campo "frequency" em atividades de biomarcadores — use APENAS "frequencyValue" e "frequencyUnit".

---

## 3. ESTILO DE VIDA

- **Movimentos**: Use EXATAMENTE os tipos "Movimentos - Passos" e/ou "Movimentos - Gasto Calórico". NUNCA use apenas "Movimentos".
  - "Movimentos - Passos": "desiredParameter" = NÚMERO de passos por dia (ex: 8000).
  - "Movimentos - Gasto Calórico": "desiredParameter" = NÚMERO de kcal por dia (ex: 250).
  - Para cada categoria: 2-3 atividades com "name", "description" e "frequency" (ex: "5x Semana", "Diariamente").
- **Alimentação**: "type": "Alimentação". "desiredParameter" = STRING com meta alimentar (ex: "Aumentar consumo de fibras e reduzir ultraprocessados"). Inclua 2-3 atividades e 1-2 orientações (com "area": "Alimentação").
- **Peso** (quando relevante): "type": "Peso". "desiredParameter" deve ser um OBJETO com os seguintes campos:
  - "currentWeight": número com o peso atual em kg (use o valor dos dados do checkup)
  - "objective": EXATAMENTE "Ganhar" ou "Perder"
  - "quantity": número de kg a ganhar/perder (ex: 5)
  - "deadline": número inteiro do prazo (ex: 3)
  - "deadlineUnit": EXATAMENTE "Dias", "Semanas" ou "Meses" (com 's' no plural)
  - "patientGuidelines": string com orientações ao paciente (ex: "Seguir as orientações de exercícios e alimentação")
- **Hidratação** (quando relevante): "type": "Hidratação". "desiredParameter" = NÚMERO de litros por dia (ex: 2).

---

## 4. PRINCÍPIOS

- Use linguagem clara, empática e voltada ao paciente.
- Atividades factíveis, específicas, com frequência e prazo quando cabível.
- Orientações educativas e baseadas em evidências.
- Limite: 2-3 metas por pilar, 2-4 categorias de estilo de vida.
- Priorize os problemas identificados na classificação de risco.

---

## 5. FORMATO DE RESPOSTA

Retorne APENAS um JSON válido, sem markdown, sem texto adicional. Siga EXATAMENTE esta estrutura:

{
  "mentalHealth": {
    "goals": [
      {
        "type": "Qualidade de Sono",
        "desiredParameter": 8,
        "activities": [
          {
            "name": "Estabelecer rotina de sono",
            "description": "Ir para a cama e acordar no mesmo horário todos os dias, inclusive fins de semana",
            "frequency": "Diariamente",
            "deadlineValue": "4",
            "deadlineUnit": "Semana"
          },
          {
            "name": "Registro de horários de sono",
            "description": "Anotar hora de deitar e de levantar para monitorar a consistência da rotina",
            "frequency": "Diariamente"
          }
        ],
        "orientations": [
          {
            "title": "Higiene do sono",
            "description": "Evitar telas 1h antes de dormir, manter o quarto escuro, silencioso e com temperatura agradável"
          }
        ]
      },
      {
        "type": "Estresse",
        "desiredParameter": "moderado",
        "activities": [
          {
            "name": "Mindfulness e meditação guiada",
            "description": "Participar de sessões de meditação guiada online ou por aplicativo, 3 vezes por semana",
            "frequency": "3x/semana"
          }
        ],
        "orientations": [
          {
            "title": "Técnicas de relaxamento",
            "description": "Respiração diafragmática: inspire por 4s, segure 4s, expire por 6s. Praticar diariamente"
          }
        ]
      }
    ]
  },
  "biomarkers": {
    "goals": [
      {
        "name": "Controlar Pressão Arterial",
        "desiredParameter": "Manter abaixo de 130/85 mmHg",
        "activities": [
          {
            "name": "Aferição da pressão arterial",
            "description": "Medir em repouso, 30 minutos após acordar, com o paciente sentado. Anotar os valores sistólico e diastólico",
            "frequencyValue": "3",
            "frequencyUnit": "Semana",
            "deadlineValue": "3",
            "deadlineUnit": "Mês"
          }
        ],
        "orientations": [
          {
            "title": "Redução de sódio",
            "description": "Limitar consumo de sal a menos de 5g por dia; evitar alimentos ultraprocessados"
          }
        ]
      },
      {
        "name": "Monitoramento da Glicemia Capilar",
        "desiredParameter": "Glicemia em jejum abaixo de 100 mg/dL",
        "activities": [
          {
            "name": "Medição da glicemia capilar",
            "description": "Medir a glicemia capilar em jejum, pela manhã, antes de qualquer refeição",
            "frequencyValue": "1",
            "frequencyUnit": "Semana",
            "deadlineValue": "3",
            "deadlineUnit": "Mês"
          }
        ],
        "orientations": [
          {
            "title": "Controle glicêmico",
            "description": "Reduzir carboidratos refinados e açúcares simples; priorizar alimentos com baixo índice glicêmico"
          }
        ]
      }
    ]
  },
  "lifestyle": {
    "categories": [
      {
        "type": "Peso",
        "desiredParameter": {
          "currentWeight": 85,
          "objective": "Perder",
          "quantity": 5,
          "deadline": 3,
          "deadlineUnit": "Meses",
          "patientGuidelines": "Seguir as orientações de exercício e alimentação para otimizar a perda de gordura"
        },
        "activities": [
          {
            "name": "Monitoramento do peso",
            "description": "Pesar-se 1 vez por semana, pela manhã, em jejum, com a mesma balança",
            "frequency": "1x/semana"
          }
        ],
        "orientations": [
          {
            "area": "Peso",
            "title": "Estratégias para perda de peso saudável",
            "description": "Déficit calórico moderado combinado com atividade física regular; evitar dietas extremamente restritivas"
          }
        ]
      },
      {
        "type": "Movimentos - Passos",
        "desiredParameter": 8000,
        "activities": [
          {
            "name": "Caminhada diária",
            "description": "Caminhar pelo menos 30 minutos por dia, buscando atingir a meta de passos diários",
            "frequency": "Diariamente"
          },
          {
            "name": "Subir escadas",
            "description": "Preferir escadas ao elevador quando possível para aumentar o total de passos",
            "frequency": "5x Semana"
          }
        ],
        "orientations": [
          {
            "area": "Movimentos",
            "title": "Benefícios da caminhada regular",
            "description": "Caminhada melhora saúde cardiovascular, humor e controle de peso. Use aplicativo ou relógio para contar os passos"
          }
        ]
      },
      {
        "type": "Alimentação",
        "desiredParameter": "Aumentar consumo de alimentos in natura e reduzir ultraprocessados",
        "activities": [
          {
            "name": "Incluir 5 porções de frutas e verduras",
            "description": "Adicionar frutas no café da manhã e salada no almoço e jantar diariamente",
            "frequency": "Diariamente"
          },
          {
            "name": "Trocar snacks industriais por naturais",
            "description": "Substituir biscoitos ou salgadinhos por fruta, iogurte natural ou castanhas",
            "frequency": "Diariamente"
          }
        ],
        "orientations": [
          {
            "area": "Alimentação",
            "title": "Alimentação baseada em evidências",
            "description": "Priorizar alimentos in natura ou minimamente processados; ler os rótulos e evitar produtos com longas listas de ingredientes"
          }
        ]
      },
      {
        "type": "Hidratação",
        "desiredParameter": 2,
        "activities": [
          {
            "name": "Beber água regularmente",
            "description": "Manter uma garrafa de água visível e beber ao longo do dia, priorizando antes das refeições",
            "frequency": "Diariamente"
          }
        ],
        "orientations": [
          {
            "area": "Hidratação",
            "title": "Importância da hidratação",
            "description": "Beber pelo menos 2 litros de água por dia. A água é essencial para o metabolismo e controle do apetite"
          }
        ]
      }
    ]
  },
  "reasoning": "Breve explicação clínica das recomendações baseadas nos dados do checkup"
}

**REGRAS FINAIS — OBRIGATÓRIAS:**
- Retorne APENAS o JSON, sem markdown, sem blocos de código, sem explicações.
- Todas as atividades de Saúde Mental e Estilo de Vida DEVEM ter "frequency".
- Atividades de Biomarcadores DEVEM ter "frequencyValue", "frequencyUnit", "deadlineValue" e "deadlineUnit".
- "Qualidade de Sono" desiredParameter = NÚMERO (ex: 8). "Estresse" = "baixo"|"moderado"|"alto". "Humor" = "ruim"|"intermediário"|"bom".
- Tipo "Peso" em Estilo de Vida: desiredParameter DEVE ser um OBJETO com currentWeight, objective, quantity, deadline, deadlineUnit (plural: "Dias"|"Semanas"|"Meses") e patientGuidelines.
- Movimentos: use EXATAMENTE "Movimentos - Passos" ou "Movimentos - Gasto Calórico" com desiredParameter numérico.
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
