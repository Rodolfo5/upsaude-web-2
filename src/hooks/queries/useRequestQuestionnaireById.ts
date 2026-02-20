import { useQuery } from '@tanstack/react-query'

import { findRequestQuestionnaireById } from '@/services/requestQuestionnaires'

export function useRequestQuestionnaireById(requestQuestionnaireId?: string) {
  return useQuery({
    queryKey: ['requestQuestionnaire', requestQuestionnaireId],
    queryFn: () => {
      if (!requestQuestionnaireId)
        throw new Error('Request Questionnaire ID is required')
      return findRequestQuestionnaireById(requestQuestionnaireId)
    },
    enabled: !!requestQuestionnaireId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
