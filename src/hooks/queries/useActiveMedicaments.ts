import { useQuery } from '@tanstack/react-query'

import { getActiveMedicaments } from '@/services/medicaments'

export function useActiveMedicaments(patientId: string) {
  return useQuery({
    queryKey: ['active-medicaments', patientId],
    queryFn: async () => {
      if (!patientId) return []
      const { medicaments, error } = await getActiveMedicaments(patientId)
      if (error) throw new Error(error)
      return medicaments
    },
    enabled: !!patientId,
  })
}
