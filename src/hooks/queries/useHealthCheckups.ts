import { useQuery } from '@tanstack/react-query'

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
  })
}
