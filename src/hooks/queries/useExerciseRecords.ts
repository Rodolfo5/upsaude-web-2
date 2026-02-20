import { useQuery } from '@tanstack/react-query'

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
  })
}
