import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import useUser from '@/hooks/useUser'
import { getAllConsultationsByDoctor } from '@/services/consultation'

export function getConsultationsByDoctorQueryKey(doctorId: string) {
  return ['consultations', 'byDoctor', doctorId]
}

const useConsultationsForDashboard = () => {
  const { currentUser } = useUser()
  const doctorId = currentUser?.id ?? ''

  return useQuery({
    queryKey: getConsultationsByDoctorQueryKey(doctorId),
    queryFn: () => getAllConsultationsByDoctor(doctorId),
    select: (data) => (Array.isArray(data) ? data : data.consultations),
    enabled: Boolean(doctorId),
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

export default useConsultationsForDashboard
