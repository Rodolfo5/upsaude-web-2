import { useQuery } from '@tanstack/react-query'

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
  })
}
