export type RiskClassification = 'LOW' | 'MODERATE' | 'HIGH'
export interface HealthScoreInput {
  /** Percentual de adesão às metas (0-100) */
  goalsAdherence: number
  /** Idade do paciente */
  age: number
  /** Classificação de risco do paciente */
  riskClassification?: RiskClassification
}

export interface HealthScoreResult {
  /** Score final calculado (0-100) */
  finalScore: number
  /** Score das metas (máximo 70 pontos) */
  goalsScore: number
  /** Score da idade (máximo 10 pontos) */
  ageScore: number
  /** Score do risco (máximo 20 pontos) */
  riskScore: number
  /** Label de risco baseado no score final */
  riskLabel: string
}

export interface AgeRange {
  min: number
  max: number
  factor: number
  description: string
}

export interface RiskFactor {
  classification: RiskClassification[]
  factor: number
  description: string
  points: number
}
