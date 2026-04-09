import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { findAllNotes } from '@/services/notes'

export function useNotes(patientId?: string) {
  const targetId = patientId

  return useQuery({
    queryKey: ['notes', targetId],
    queryFn: () => {
      if (!targetId) {
        throw new Error('User ID is required')
      }
      return findAllNotes(targetId)
    },
    enabled: !!targetId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}
