import { useQuery } from '@tanstack/react-query'

import { getConsultationsByPlanId } from '@/services/consultation'

export const useConsultationsByPlan = (planId: string, enabled = true) => {
  return useQuery({
    queryKey: ['consultationsByPlan', planId],
    queryFn: async () => {
      const result = await getConsultationsByPlanId(planId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.consultations
    },
    enabled: Boolean(planId) && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export default useConsultationsByPlan
