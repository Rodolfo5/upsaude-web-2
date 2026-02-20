import { useQuery } from '@tanstack/react-query'

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
  })
}
