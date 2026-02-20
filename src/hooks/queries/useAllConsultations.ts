import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { getAllConsultations } from '@/services/consultation'

export function getAllConsultationsQueryKey() {
  return ['consultations']
}

export const getAllConsultationsQueryFn = () => {
  return () => getAllConsultations()
}

const useAllConsultations = () => {
  return useQuery({
    queryKey: getAllConsultationsQueryKey(),
    queryFn: getAllConsultationsQueryFn(),
    select: (data) => (Array.isArray(data) ? data : data.consultations),
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

export default useAllConsultations
