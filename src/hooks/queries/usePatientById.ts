import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { getPatientById } from '@/services/patient'

export function usePatientById(patientId: string) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => getPatientById(patientId),
    enabled: !!patientId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
}

export default usePatientById
