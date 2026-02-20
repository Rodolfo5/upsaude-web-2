import { useQuery } from '@tanstack/react-query'

import useAuth from '@/hooks/useAuth'
import { findAllRequestQuestionnairesForPatient } from '@/services/requestQuestionnaires'

export function useRequestQuestionnaires(patientId?: string) {
  const { userUid } = useAuth()

  const targetId = patientId || userUid

  return useQuery({
    queryKey: ['requestQuestionnaires', targetId],
    queryFn: () => {
      if (!targetId) throw new Error('User ID is required')
      return findAllRequestQuestionnairesForPatient(targetId)
    },
    enabled: !!targetId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
