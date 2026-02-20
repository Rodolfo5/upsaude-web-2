import { useQuery } from '@tanstack/react-query'

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
  })
}
