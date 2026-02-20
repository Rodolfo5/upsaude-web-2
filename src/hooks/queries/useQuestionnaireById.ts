import { useQuery } from '@tanstack/react-query'

import { findQuestionnaireById } from '@/services/questionnaires'

export function useQuestionnaireById(questionnaireId?: string) {
  return useQuery({
    queryKey: ['questionnaire', questionnaireId],
    queryFn: () => {
      if (!questionnaireId) throw new Error('Questionnaire ID is required')
      return findQuestionnaireById(questionnaireId)
    },
    enabled: !!questionnaireId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
