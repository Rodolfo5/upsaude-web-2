import { useQuery } from '@tanstack/react-query'

import useUser from '@/hooks/useUser'
import { findAllPrescriptionsByDoctor } from '@/services/exam'

const FORTY_FIVE_MINUTES_IN_MS = 45 * 60 * 1000

export const useAllPrescriptionsByDoctor = () => {
  const { currentUser } = useUser()
  const doctorId = currentUser?.id

  return useQuery({
    queryKey: ['all-prescriptions-by-doctor', doctorId],
    queryFn: async () => {
      if (!doctorId) throw new Error('DoctorId é obrigatório')
      return await findAllPrescriptionsByDoctor(doctorId)
    },
    enabled: !!doctorId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

export default useAllPrescriptionsByDoctor
