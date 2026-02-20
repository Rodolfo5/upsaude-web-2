import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { getConsultationPlans } from '@/services/consultationPlan'

export function getConsultationPlansQueryKey(
  userId: string,
  therapeuticPlanId: string,
) {
  return ['consultation-plans', userId, therapeuticPlanId]
}

export const getConsultationPlansQueryFn = async (
  userId: string,
  therapeuticPlanId: string,
) => {
  const { plans, error } = await getConsultationPlans(userId, therapeuticPlanId)

  if (error) {
    throw new Error(error)
  }

  return plans
}

const useConsultationPlans = (userId: string, therapeuticPlanId: string) => {
  return useQuery({
    queryKey: getConsultationPlansQueryKey(userId, therapeuticPlanId),
    queryFn: () => getConsultationPlansQueryFn(userId, therapeuticPlanId),
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
    enabled: !!userId && !!therapeuticPlanId,
  })
}

export default useConsultationPlans
