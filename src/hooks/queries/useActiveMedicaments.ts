import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { getMedicamentsForDisplay } from '@/services/medicaments'

export function useActiveMedicaments(patientId: string) {
  return useQuery({
    queryKey: ['active-medicaments', patientId],
    queryFn: async () => {
      if (!patientId) return []
      const { medicaments, error } = await getMedicamentsForDisplay(patientId)
      if (error) throw new Error(error)
      return medicaments
    },
    enabled: !!patientId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}
