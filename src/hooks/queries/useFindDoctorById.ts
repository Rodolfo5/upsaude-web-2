import { useQuery } from '@tanstack/react-query'

import { findDoctorById } from '@/services/doctor'

export function useFindDoctorById(doctorId: string) {
  return useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => findDoctorById(doctorId),
    enabled: !!doctorId,
  })
}
