import type { AgeRange, RiskFactor } from '@utils/healthScore/types'

/**
 * Faixas etárias para cálculo do Score de Idade
 * Escala de 10 pontos máximo
 */
export const AGE_RANGES: AgeRange[] = [
  {
    min: 0,
    max: 29,
    factor: 1.0, // 100% dos 10 pontos
    description: 'Menores de 30 anos',
  },
  {
    min: 30,
    max: 45,
    factor: 0.8, // 80% dos 10 pontos
    description: '30–45 anos',
  },
  {
    min: 46,
    max: 60,
    factor: 0.6, // 60% dos 10 pontos
    description: '46–60 anos',
  },
  {
    min: 61,
    max: 75,
    factor: 0.4, // 40% dos 10 pontos
    description: '61–75 anos',
  },
  {
    min: 76,
    max: Infinity,
    factor: 0.2, // 20% dos 10 pontos
    description: '76+ anos',
  },
]

/**
 * Fatores de risco para cálculo do Score de Risco
 * Escala de 20 pontos máximo
 */
export const RISK_FACTORS: RiskFactor[] = [
  {
    classification: ['LOW'],
    factor: 1.0, // 100% dos 20 pontos
    description: 'Baixo risco',
    points: 20,
  },
  {
    classification: ['MODERATE'],
    factor: 0.6, // 60% dos 20 pontos
    description: 'Médio risco',
    points: 12,
  },
  {
    classification: ['HIGH'],
    factor: 0.2, // 20% dos 20 pontos
    description: 'Alto risco',
    points: 4,
  },
]

/**
 * Pontuações máximas para cada componente do score
 */
export const SCORE_WEIGHTS = {
  GOALS: 70, // 70% - Metas e atividades de saúde
  AGE: 10, // 10% - Idade
  RISK: 20, // 20% - Classificação de risco
} as const

/**
 * Classificação de risco baseada no score final
 */
export const SCORE_RISK_CLASSIFICATION = [
  {
    min: 0,
    max: 39,
    label: 'Alto',
    color: '#ef4444', // red
    description: 'Score baixo - necessita atenção médica',
  },
  {
    min: 40,
    max: 69,
    label: 'Moderado',
    color: '#f59e0b', // amber
    description: 'Score moderado - acompanhamento regular',
  },
  {
    min: 70,
    max: 100,
    label: 'Baixo',
    color: '#10b981', // emerald
    description: 'Score alto - boa condição de saúde',
  },
] as const
