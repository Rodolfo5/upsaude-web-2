import { useQuery } from '@tanstack/react-query'

import { findAllQuestionnairesByPatient } from '@/services/questionnaires'

export function useQuestionnaires(patientId?: string) {
  const targetId = patientId

  return useQuery({
    queryKey: ['questionnaires', targetId],
    queryFn: () => {
      if (!targetId) throw new Error('User ID is required')
      return findAllQuestionnairesByPatient(targetId)
    },
    enabled: !!targetId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
