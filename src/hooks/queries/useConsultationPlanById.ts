import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { getConsultationPlanById } from '@/services/consultationPlan'

export function getConsultationPlanByIdQueryKey(
  therapeuticPlanId: string,
  planId: string,
  patientId: string | undefined,
) {
  return ['consultation-plan-by-id', therapeuticPlanId, planId, patientId]
}

export const getConsultationPlanByIdQueryFn =
  (therapeuticPlanId: string, planId: string, patientId: string | undefined) =>
  async () => {
    if (!patientId) {
      throw new Error('PatientId é obrigatório')
    }

    const result = await getConsultationPlanById(
      patientId,
      therapeuticPlanId,
      planId,
    )

    if (!result) {
      throw new Error('Plano de consulta não encontrado')
    }

    return result
  }
const useConsultationPlanById = (
  therapeuticPlanId: string,
  planId: string,
  patientId: string | undefined,
) => {
  return useQuery({
    queryKey: getConsultationPlanByIdQueryKey(
      therapeuticPlanId,
      planId,
      patientId,
    ),
    queryFn: getConsultationPlanByIdQueryFn(
      therapeuticPlanId,
      planId,
      patientId,
    ),
    enabled: !!patientId && !!therapeuticPlanId && !!planId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

export default useConsultationPlanById
