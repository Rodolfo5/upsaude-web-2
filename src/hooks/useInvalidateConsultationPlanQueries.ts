import { useQueryClient } from '@tanstack/react-query'

import { getConsultationPlanByIdQueryKey } from './queries/useConsultationPlanById'

export const useInvalidateConsultationPlanQueries = (
  therapeuticPlanId: string,
  planId: string,
  patientId: string,
  doctorId?: string,
) => {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: getConsultationPlanByIdQueryKey(
        therapeuticPlanId,
        planId,
        patientId,
      ),
    })
    queryClient.invalidateQueries({
      queryKey: ['consultationsByPlan', planId],
    })
    if (doctorId) {
      queryClient.invalidateQueries({
        queryKey: ['doctor', doctorId],
      })
    }
  }

  return invalidate
}
