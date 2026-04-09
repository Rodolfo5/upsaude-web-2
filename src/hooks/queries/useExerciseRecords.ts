import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { getExerciseRecordsByDateRange } from '@/services/exerciseRecords'

/**
 * Hook para buscar registros de exercícios por intervalo de datas
 */
export function useExerciseRecords(
  patientId: string,
  startDate: Date,
  endDate: Date,
) {
  return useQuery({
    queryKey: [
      'exercise-records',
      patientId,
      startDate.toISOString(),
      endDate.toISOString(),
    ],
    queryFn: () => getExerciseRecordsByDateRange(patientId, startDate, endDate),
    enabled: !!patientId && !!startDate && !!endDate,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}
