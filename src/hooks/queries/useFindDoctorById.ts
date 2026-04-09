import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { findDoctorById } from '@/services/doctor'

export function useFindDoctorById(doctorId: string) {
  return useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => findDoctorById(doctorId),
    enabled: !!doctorId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}
