import { calculateHealthScore } from '@/utils/healthScore'
import type { HealthScoreInput } from '@/utils/healthScore'

export function getHealthScore(input: HealthScoreInput) {
  const scoreResult = calculateHealthScore(input)

  const finalScore = scoreResult.finalScore
  const remaining = 100 - finalScore

  const chartData = [
    {
      name: 'score',
      value: finalScore,
      color: '#5b21b6', // purple-800
      label: 'Score de Saúde',
    },
    {
      name: 'remaining',
      value: remaining,
      color: '#c026d3', // fuchsia-600 (rosa)
      label: 'Restante',
    },
  ]

  return {
    scoreResult,
    chartData,
  }
}

export type HealthScoreServiceReturn = ReturnType<typeof getHealthScore>
