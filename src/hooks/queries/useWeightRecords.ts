import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { getWeightRecordsByDateRange } from '@/services/weightRecords'

/**
 * Hook para buscar registros de peso por intervalo de datas
 */
export function useWeightRecords(
  patientId: string,
  startDate: Date,
  endDate: Date,
) {
  return useQuery({
    queryKey: [
      'weight-records',
      patientId,
      startDate.toISOString(),
      endDate.toISOString(),
    ],
    queryFn: () => getWeightRecordsByDateRange(patientId, startDate, endDate),
    enabled: !!patientId && !!startDate && !!endDate,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}
