import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import useUser from '@/hooks/useUser'
import { getComplementaryConsultationsByDoctor } from '@/services/complementaryConsultation'

export function getComplementaryConsultationsQueryKey(
  doctorId: string | undefined,
) {
  return ['complementary-consultations', doctorId]
}

export const getComplementaryConsultationsQueryFn =
  (doctorId: string | undefined) => async () => {
    if (!doctorId) {
      throw new Error('DoctorId é obrigatório')
    }

    const result = await getComplementaryConsultationsByDoctor(doctorId)
    if (result.error) {
      throw new Error(result.error)
    }

    return result.complementaryConsultations
  }

const useComplementaryConsultations = () => {
  const { currentUser } = useUser()
  const doctorId = currentUser?.id

  return useQuery({
    queryKey: getComplementaryConsultationsQueryKey(doctorId),
    queryFn: getComplementaryConsultationsQueryFn(doctorId),
    enabled: !!doctorId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

export default useComplementaryConsultations
