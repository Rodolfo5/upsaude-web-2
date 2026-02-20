import {
  AGE_RANGES,
  RISK_FACTORS,
  SCORE_WEIGHTS,
  SCORE_RISK_CLASSIFICATION,
} from '@constants/healthScore'

import type {
  HealthScoreInput,
  HealthScoreResult,
  RiskClassification,
} from './types'

/**
 * Calcula o Score das Metas baseado no percentual de adesão
 * @param adherencePercentage Percentual de adesão (0-100)
 * @returns Score das metas (máximo 70 pontos)
 */
export function calculateGoalsScore(adherencePercentage: number): number {
  // Garante que o percentual está entre 0 e 100
  const normalizedPercentage = Math.max(0, Math.min(100, adherencePercentage))
  // ScoreMetas = Percentual de adesão às metas × 0.70
  return normalizedPercentage * 0.7
}

/**
 * Calcula o Score da Idade baseado na faixa etária
 * @param age Idade do paciente
 * @returns Score da idade (máximo 10 pontos)
 */
export function calculateAgeScore(age: number): number {
  // Encontra a faixa etária correspondente
  const ageRange = AGE_RANGES.find(
    (range) => age >= range.min && age <= range.max,
  )
  if (!ageRange) {
    // Fallback para idades muito altas
    const lastRange = AGE_RANGES[AGE_RANGES.length - 1]
    return SCORE_WEIGHTS.AGE * lastRange.factor
  }
  // ScoreIdade = Fator da faixa etária × 10
  return SCORE_WEIGHTS.AGE * ageRange.factor
}

/**
 * Calcula o Score de Risco baseado na classificação
 * @param riskClassification Classificação de risco do paciente
 * @returns Score de risco (máximo 20 pontos)
 */
export function calculateRiskScore(
  riskClassification?: RiskClassification,
): number {
  if (!riskClassification) {
    // Se não tiver classificação, assume risco médio
    return SCORE_WEIGHTS.RISK * 0.6
  }
  // Encontra o fator de risco correspondente
  const riskFactor = RISK_FACTORS.find((factor) =>
    factor.classification.includes(
      riskClassification.toLowerCase() as RiskClassification,
    ),
  )
  if (!riskFactor) {
    // Fallback para risco médio se não encontrar
    return SCORE_WEIGHTS.RISK * 0.6
  }
  // ScoreRisco = Fator de risco × 20
  return SCORE_WEIGHTS.RISK * riskFactor.factor
}

/**
 * Determina o label de risco baseado no score final
 * @param finalScore Score final calculado
 * @returns Label de risco
 */
export function getRiskLabel(finalScore: number): string {
  const classification = SCORE_RISK_CLASSIFICATION.find(
    (range) => finalScore >= range.min && finalScore <= range.max,
  )
  return classification?.label || 'Moderado'
}

/**
 * Calcula o Score de Saúde completo
 * @param input Dados de entrada para o cálculo
 * @returns Resultado completo do cálculo
 */
export function calculateHealthScore(
  input: HealthScoreInput,
): HealthScoreResult {
  const goalsScore = calculateGoalsScore(input.goalsAdherence)
  const ageScore = calculateAgeScore(input.age)
  const riskScore = calculateRiskScore(input.riskClassification)
  // ScoreFinal = ScoreMetas + ScoreIdade + ScoreRisco
  const finalScore = Math.round((goalsScore + ageScore + riskScore) * 100) / 100
  const riskLabel = getRiskLabel(finalScore)
  return {
    finalScore: Math.round(finalScore),
    goalsScore: Math.round(goalsScore * 100) / 100,
    ageScore: Math.round(ageScore * 100) / 100,
    riskScore: Math.round(riskScore * 100) / 100,
    riskLabel,
  }
}
