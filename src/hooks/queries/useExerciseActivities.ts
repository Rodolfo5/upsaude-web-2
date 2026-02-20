import { useQuery } from '@tanstack/react-query'

import { getExerciseActivities } from '@/services/exerciseActivities'

/**
 * Hook para buscar atividades de recomendação de exercício
 */
export function useExerciseActivities(patientId: string) {
  return useQuery({
    queryKey: ['exercise-activities', patientId],
    queryFn: () => getExerciseActivities(patientId),
    enabled: !!patientId,
  })
}
