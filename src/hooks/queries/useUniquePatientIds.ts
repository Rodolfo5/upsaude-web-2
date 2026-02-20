import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import useUser from '@/hooks/useUser'
import { getUniquePatientIdsByDoctor } from '@/services/consultation'

export function getUniquePatientIdsQueryKey(doctorId: string | undefined) {
  return ['patientIds', doctorId]
}

export const getUniquePatientIdsQueryFn =
  (doctorId: string | undefined) => async () => {
    if (!doctorId) {
      throw new Error('DoctorId é obrigatório')
    }
    const result = await getUniquePatientIdsByDoctor(doctorId)
    if (result.error) {
      throw new Error(result.error)
    }
    return result.patientIds
  }

const useUniquePatientIds = () => {
  const { currentUser } = useUser()
  const doctorId = currentUser?.id

  return useQuery({
    queryKey: getUniquePatientIdsQueryKey(doctorId),
    queryFn: getUniquePatientIdsQueryFn(doctorId),
    enabled: !!doctorId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

export default useUniquePatientIds
