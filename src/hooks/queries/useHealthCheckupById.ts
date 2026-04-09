import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { findHealthCheckupById } from '@/services/healthCheckups'

export function useHealthCheckupById(checkupId: string, userId?: string) {
  return useQuery({
    queryKey: ['healthCheckup', checkupId, userId],
    queryFn: async () => {
      if (!userId) {
        // Se não tiver userId, precisamos extrair do checkupId ou contexto
        // Por agora, vamos assumir que o checkupId contém a informação necessária
        // ou que o serviço pode lidar com isso
        throw new Error('User ID is required to fetch health checkup')
      }
      return findHealthCheckupById(userId, checkupId)
    },
    enabled: !!checkupId && !!userId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}
