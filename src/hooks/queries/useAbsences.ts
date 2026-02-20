import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { getAbsences } from '@/services/absence'

export function getAbsencesQueryKey(doctorId: string | undefined) {
  return ['absences', doctorId]
}

export const getAbsencesQueryFn = (doctorId: string | undefined) => {
  return () => {
    if (!doctorId) {
      return Promise.resolve({ absences: [], error: null })
    }
    return getAbsences(doctorId)
  }
}

const useAbsences = (doctorId: string | undefined) => {
  return useQuery({
    queryKey: getAbsencesQueryKey(doctorId),
    queryFn: getAbsencesQueryFn(doctorId),
    select: (data) => (Array.isArray(data) ? data : data.absences),
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
    enabled: !!doctorId,
  })
}

export default useAbsences
