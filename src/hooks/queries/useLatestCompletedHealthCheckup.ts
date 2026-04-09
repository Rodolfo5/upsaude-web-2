import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { findLatestCompletedHealthCheckup } from '@/services/healthCheckups'

export function useLatestCompletedHealthCheckup(patientId?: string) {
  return useQuery({
    queryKey: ['latestCompletedHealthCheckup', patientId],
    queryFn: () => {
      if (!patientId) {
        throw new Error('User ID is required')
      }
      return findLatestCompletedHealthCheckup(patientId)
    },
    enabled: !!patientId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}
