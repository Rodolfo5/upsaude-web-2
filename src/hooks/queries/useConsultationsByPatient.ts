import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { getConsultationsByPatientId } from '@/services/consultation'

export function getConsultationsByPatientQueryKey(patientId: string) {
  return ['consultations', 'by-patient', patientId]
}

export const getConsultationsByPatientQueryFn = async (patientId: string) => {
  const { consultations, error } = await getConsultationsByPatientId(patientId)

  if (error) {
    throw new Error(error)
  }

  return consultations
}

const useConsultationsByPatient = (patientId: string) => {
  return useQuery({
    queryKey: getConsultationsByPatientQueryKey(patientId),
    queryFn: () => getConsultationsByPatientQueryFn(patientId),
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
    enabled: !!patientId,
  })
}

export default useConsultationsByPatient
