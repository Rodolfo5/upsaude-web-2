// Tipos
export type {
  HealthScoreInput,
  HealthScoreResult,
  RiskClassification,
  AgeRange,
  RiskFactor,
} from './types'

// Constantes
export {
  AGE_RANGES,
  RISK_FACTORS,
  SCORE_WEIGHTS,
  SCORE_RISK_CLASSIFICATION,
} from '@constants/healthScore'

// Funções de cálculo
export {
  calculateGoalsScore,
  calculateAgeScore,
  calculateRiskScore,
  calculateHealthScore,
  getRiskLabel,
} from './calculator'
