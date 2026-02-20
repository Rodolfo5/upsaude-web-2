import { ActivityEntity } from '@/types/entities/healthPillar'

import { getHealthPillar } from './healthPillar'
import { getAllActivitiesByPillar } from './healthPillarActivity'
import { getAllTherapeuticPlansByPatient } from './therapeuticPlan'

const EXERCISE_ACTIVITY_NAME = 'Recomendação de exercício'

/**
 * Busca todas as atividades de recomendação de exercício do paciente
 */
export async function getExerciseActivities(
  patientId: string,
): Promise<ActivityEntity[]> {
  if (!patientId) return []

  const plans = await getAllTherapeuticPlansByPatient(patientId)
  if (plans.length === 0) return []

  const latestPlan = plans[0]

  try {
    const healthPillarRef = await getHealthPillar(
      patientId,
      latestPlan.id,
      'Estilo de Vida',
    )

    if (!healthPillarRef) return []

    const activities = await getAllActivitiesByPillar(
      patientId,
      latestPlan.id,
      healthPillarRef.id,
    )

    // Filtrar apenas recomendações de exercício
    return activities.filter(
      (activity) => activity.name === EXERCISE_ACTIVITY_NAME,
    )
  } catch (error) {
    console.error('Erro ao buscar atividades de exercício:', error)
    return []
  }
}
