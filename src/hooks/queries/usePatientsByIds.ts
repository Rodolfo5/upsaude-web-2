import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { getPatientsByIds } from '@/services/patient'

export function getPatientsByIdsQueryKey(patientIds: string[]) {
  return ['patients-by-ids', patientIds]
}

export const usePatientsByIds = (patientIds: string[]) => {
  return useQuery({
    queryKey: getPatientsByIdsQueryKey(patientIds),
    queryFn: async () => {
      if (patientIds.length === 0) return []
      const result = await getPatientsByIds(patientIds)
      if (result.error) throw new Error(result.error)
      return result.patients
    },
    enabled: patientIds.length > 0,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}
