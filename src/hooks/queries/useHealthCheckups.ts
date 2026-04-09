import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { findAllHealthCheckups } from '@/services/healthCheckups'

export function useHealthCheckups(patientId?: string) {
  return useQuery({
    queryKey: ['healthCheckups', patientId],
    queryFn: () => {
      if (!patientId) {
        throw new Error('User ID is required')
      }
      return findAllHealthCheckups(patientId)
    },
    enabled: !!patientId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}
