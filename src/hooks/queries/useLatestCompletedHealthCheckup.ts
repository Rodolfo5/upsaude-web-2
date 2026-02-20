import { useQuery } from '@tanstack/react-query'

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
  })
}
