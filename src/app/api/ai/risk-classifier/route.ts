/**
 * 🤖 API DE CLASSIFICAÇÃO DE RISCO COM IA
 *
 * Endpoint para gerar classificação de risco a partir de um checkup digital.
 * Utiliza Vertex AI (Gemini) para análise.
 */

import { VertexAI, type Part } from '@google-cloud/vertexai'
import { NextResponse } from 'next/server'

import { adminFirestore, getAdminApp } from '@/config/firebase/firebaseAdmin'
import { RiskClassification } from '@/utils/healthScore/types'

// ====================================================================
// 📋 DIRETRIZES DE CLASSIFICAÇÃO DE RISCO
// ====================================================================

const RISK_CLASSIFICATION_GUIDELINES = `
ESTRUTURA DE AÇÃO POR NÍVEL DE RISCO

• Paciente de Risco Alto (Vermelho): Exige intervenção ativa e prioritária. O foco é no controle rápido da condição, prevenção de eventos agudos e/ou investigação diagnóstica urgente.

• Paciente de Risco Moderado (Amarelo): O principal alvo da medicina preventiva. O foco é na modificação intensiva do estilo de vida, início de tratamento farmacológico (se indicado) e estabelecimento de metas claras para reduzir o risco a longo prazo.

• Paciente de Risco Baixo (Verde): O foco é na educação, reforço de hábitos saudáveis e manutenção do estado de baixo risco através de acompanhamento preventivo regular.

PROTOCOLOS DE TRATAMENTO POR DOENÇA E ESTRATIFICAÇÃO

1. HIPERTENSÃO ARTERIAL

• Paciente de Risco Alto (Vermelho):
  - Perfil: PA ≥ 180/110 mmHg; ou com sintomas de alerta (dor no peito, falta de ar, cefaleia intensa); ou com doença cardiovascular já estabelecida e PA descontrolada.
  - Ação Imediata: Teleconsulta prioritária (< 48h) ou orientação para busca de serviço de emergência.
  - Metas: PA < 130/80 mmHg.
  - Tratamento: Terapia anti-hipertensiva combinada (2+ fármacos: IECAs/BRAs, BCCs, Diuréticos). Restrição de sódio.
  - Monitoramento: Acompanhamento semanal ou quinzenal até estabilização.

• Paciente de Risco Moderado (Amarelo):
  - Perfil: PA entre 140-179 / 90-109 mmHg; ou pré-hipertensão com outros fatores de risco.
  - Metas: PA < 130/80 mmHg.
  - Tratamento: MEV intensiva (dieta DASH, redução de sódio <2g/dia, 150 min/semana de atividade física). Considerar monoterapia anti-hipertensiva.
  - Monitoramento: Consultas mensais ou bimestrais.

• Paciente de Risco Baixo (Verde):
  - Perfil: PA normal (< 130/85 mmHg) e poucos fatores de risco.
  - Tratamento: Educação para saúde, reforço de hábitos saudáveis.
  - Monitoramento: Aferição anual.

2. DIABETES TIPO 2

• Paciente de Risco Alto (Vermelho):
  - Perfil: Descontrole glicêmico (glicemias muito altas/baixas, má adesão) ou FINDRISC ≥ 20.
  - Ação Imediata: Teleconsulta prioritária (< 48h).
  - Metas: HbA1c < 7,0%, Glicemia de jejum 80-130 mg/dL.
  - Tratamento: Intensificação de hipoglicemiantes (iSGLT2, análogos de GLP-1) ou insulina. Orientação nutricional.
  - Monitoramento: Consultas trimestrais. Rastreio de complicações.

• Paciente de Risco Moderado (Amarelo):
  - Perfil: FINDRISC moderado a alto; pré-diabetes.
  - Metas: Normalização da glicemia. Perda de 5-10% do peso.
  - Tratamento: MEV intensiva. Considerar Metformina (especialmente se IMC > 35 kg/m²).
  - Monitoramento: Acompanhamento semestral ou anual.

• Paciente de Risco Baixo (Verde):
  - Perfil: FINDRISC baixo.
  - Tratamento: Educação sobre fatores de risco.
  - Monitoramento: Rastreamento a cada 1-3 anos.

3. OBESIDADE

• Paciente de Risco Alto (Vermelho):
  - Perfil: IMC ≥ 40 kg/m² ou IMC ≥ 35 kg/m² com comorbidades graves.
  - Ação Imediata: Consulta prioritária multidisciplinar.
  - Metas: Perda de peso > 10%.
  - Tratamento: Dieta estruturada, exercícios supervisionados, TCC. Fármacos anti-obesidade. Avaliar cirurgia bariátrica.
  - Monitoramento: Acompanhamento mensal.

• Paciente de Risco Moderado (Amarelo):
  - Perfil: IMC 30-34,9 kg/m² ou IMC 25-29,9 kg/m² com comorbidades.
  - Metas: Perda de 5-10% em 6 meses.
  - Tratamento: MEV estruturada. Farmacoterapia se MEV falhar.
  - Monitoramento: Acompanhamento a cada 1-3 meses.

• Paciente de Risco Baixo (Verde):
  - Perfil: IMC normal ou sobrepeso sem comorbidades.
  - Tratamento: Educação sobre manutenção do peso.
  - Monitoramento: Avaliação anual.

4. CÂNCER

• Paciente de Risco Alto (Vermelho):
  - Perfil: Sinais de alerta (nódulo, sangramento inexplicado, perda de peso significativa).
  - Ação Imediata: Teleconsulta prioritária (< 48h) e encaminhamento urgente para especialista. O tratamento é a investigação.
  - Monitoramento: Acompanhamento ativo para garantir consulta presencial.

• Paciente de Risco Moderado (Amarelo):
  - Perfil: Rastreamento em atraso ou histórico familiar de alto risco.
  - Tratamento: Solicitar exames de rastreamento (mamografia, colonoscopia, Papanicolau). Considerar aconselhamento genético.
  - Monitoramento: Verificar realização do exame.

• Paciente de Risco Baixo (Verde):
  - Perfil: Rastreamentos em dia, sem sinais de alerta.
  - Tratamento: Educação sobre sinais de alerta.
  - Monitoramento: Lembretes automáticos para próximos exames.

5. SAÚDE MENTAL (DEPRESSÃO/ANSIEDADE)

• Paciente de Risco Alto (Vermelho):
  - Perfil: Ideação suicida ativa; sintomas severos com prejuízo funcional.
  - Ação Imediata: Alerta imediato com protocolo de segurança. Contato telefônico imediato, plano de segurança, encaminhamento para emergência psiquiátrica ou CAPS.
  - Tratamento: Psicoterapia (TCC) e antidepressivos (ISRS).
  - Monitoramento: Contato semanal nas fases iniciais.

• Paciente de Risco Moderado (Amarelo):
  - Perfil: Sintomas moderados com impacto na qualidade de vida.
  - Tratamento: Biblioterapia, psicoterapia, considerar ISRS. MEV (atividade física, higiene do sono).
  - Monitoramento: Acompanhamento mensal.

• Paciente de Risco Baixo (Verde):
  - Perfil: Sintomas leves ou ausentes, boa rede de apoio.
  - Tratamento: Psicoeducação sobre manejo de estresse, técnicas de relaxamento.
  - Monitoramento: Reavaliação no check-up anual.
`.trim()

// ====================================================================
// 📋 TIPOS
// ====================================================================

interface RiskClassifierRequest {
  userId: string
  healthCheckupId: string
  /** URL opcional de um PDF de referência com diretrizes de risco */
  pdfUrl?: string
}

interface RiskClassifierResponse {
  success: boolean
  error?: string
  riskClassification?: RiskClassification
  healthScore?: number // 0-100
  majorFindings?: string[]
  reasoning?: Record<string, string>
  model?: string
}

// ====================================================================
// 🚀 HANDLER POST
// ====================================================================

export async function POST(
  request: Request,
): Promise<NextResponse<RiskClassifierResponse>> {
  try {
    const body = (await request.json()) as RiskClassifierRequest
    const { healthCheckupId, userId, pdfUrl } = body

    // Validação
    if (!healthCheckupId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID do checkup digital e usuário são obrigatórios',
        },
        { status: 400 },
      )
    }

    console.log(`Iniciando classificação de risco para ${healthCheckupId}`)

    // Buscar checkup no Firestore
    await getAdminApp()
    const db = adminFirestore()
    const healthCheckupRef = db
      .collection('users')
      .doc(userId)
      .collection('healthCheckups')
      .doc(healthCheckupId)
    const healthCheckupSnap = await healthCheckupRef.get()

    if (!healthCheckupSnap.exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Checkup digital não encontrado',
        },
        { status: 404 },
      )
    }

    const healthCheckupData = healthCheckupSnap.data() || {}

    // Carregar PDF de referência se fornecido
    let pdfInlineData: {
      inlineData: { mimeType: string; data: string }
    } | null = null
    if (pdfUrl) {
      try {
        const pdfResponse = await fetch(pdfUrl)
        if (!pdfResponse.ok) {
          throw new Error(`Falha ao baixar PDF: status ${pdfResponse.status}`)
        }
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())
        pdfInlineData = {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBuffer.toString('base64'),
          },
        }
      } catch (error) {
        console.warn(
          'Não foi possível carregar o PDF de referência, seguindo sem PDF.',
          error,
        )
      }
    }

    // Prompt
    const modelName = process.env.VERTEX_MODEL || 'gemini-2.5-flash-lite'
    const location = process.env.VERTEX_LOCATION || 'us-central1'

    const prompt = `
Você é um assistente clínico especializado em triagem. Classifique o risco do paciente em LOW, MODERATE ou HIGH.

${pdfInlineData ? 'IMPORTANTE: Use as diretrizes do PDF fornecido como referência principal para classificação.' : `DIRETRIZES DE CLASSIFICAÇÃO:\n${RISK_CLASSIFICATION_GUIDELINES}\n`}

REGRAS:
- Considere idade, sintomas, comorbidades, hábitos, sinais de alarme e módulos de triagem presentes no checkup.
- Use as diretrizes acima como referência para classificar cada condição encontrada.
- Se houver múltiplas condições, classifique pelo risco MAIS ALTO encontrado.
- Se houver dúvida, classifique como MODERATE.
- Justifique usando achados específicos do checkup e as diretrizes.

FORMATO DE RESPOSTA (JSON):
{
  "healthScore": 0-100 (O nível de saúde do paciente, onde 0 é um risco urgente),
  "riskClassification": "LOW|MODERATE|HIGH" (A classificação de risco do paciente),
  "majorFindings": ["achado 1", "achado 2", "achado 3"],
  "reasoning": {
    "achado 1": "justificativa baseada nas diretrizes",
    "achado 2": "justificativa baseada nas diretrizes"
  }
}

DADOS DO CHECKUP (JSON):
${JSON.stringify(healthCheckupData, null, 2)}
`.trim()

    // Inicializar Vertex AI
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
      /\\n/g,
      '\n',
    )
    const hasSA = clientEmail && privateKey

    const vertex = new VertexAI({
      project: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      location,
      googleAuthOptions: hasSA
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
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    })

    const parts: Part[] = [{ text: prompt }]
    if (pdfInlineData) parts.push(pdfInlineData as Part)

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
    })

    const rawText =
      result.response.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text)
        .filter(Boolean)
        .join('')
        .trim() || ''

    if (!rawText) {
      return NextResponse.json(
        {
          success: false,
          error: 'IA retornou resposta vazia para classificação de risco',
        },
        { status: 500 },
      )
    }

    // Tentar parse do JSON retornado
    let parsed: {
      healthScore: number
      riskClassification?: RiskClassification
      majorFindings?: string[]
      reasoning?: Record<string, string>
    } | null = null

    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch (error) {
      console.warn(
        'Falha ao fazer parse do JSON; armazenando texto bruto.',
        error,
      )
    }

    const riskClassification =
      parsed?.riskClassification || ('MODERATE' as RiskClassification)
    const majorFindings = parsed?.majorFindings || []
    const reasoning = parsed?.reasoning || { summary: rawText }
    const healthScore = parsed?.healthScore

    // Salvar no Firestore
    await healthCheckupRef.set(
      {
        aiHealthScore: healthScore,
        aiRiskClassification: riskClassification,
        aiRiskFindings: majorFindings,
        aiRiskReasoning: reasoning,
        aiRiskModel: modelName,
        aiRiskUpdatedAt: new Date(),
        aiRiskRaw: rawText,
      },
      { merge: true },
    )

    console.log(
      `Classificação gerada e salva para healthCheckup ${healthCheckupId}: ${riskClassification}`,
    )

    return NextResponse.json({
      success: true,
      riskClassification,
      majorFindings,
      reasoning,
      model: modelName,
    })
  } catch (error) {
    console.error('Erro na API de classificação de risco:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao processar classificação de risco',
      },
      { status: 500 },
    )
  }
}
