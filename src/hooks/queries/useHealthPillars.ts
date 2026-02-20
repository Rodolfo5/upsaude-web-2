import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createHealthPillar,
  getAllHealthPillars,
  getHealthPillar,
} from '@/services/healthPillar'
import { HealthPillarEntity, HealthPillarType } from '@/types/entities/healthPillar'

import { errorToast, successToast } from '../useAppToast'

/**
 * Hook para buscar um pilar específico por tipo
 */
export const useHealthPillar = (
  patientId: string,
  planId: string,
  type: HealthPillarType,
) => {
  return useQuery({
    queryKey: ['health-pillar', patientId, planId, type],
    queryFn: () => getHealthPillar(patientId, planId, type),
    enabled: !!patientId && !!planId && !!type && planId !== 'new',
  })
}

/**
 * Hook para buscar todos os pilares de um plano
 */
export const useHealthPillars = (patientId: string, planId: string) => {
  return useQuery({
    queryKey: ['health-pillars', patientId, planId],
    queryFn: () => getAllHealthPillars(patientId, planId),
    enabled: !!patientId && !!planId && planId !== 'new',
  })
}

/**
 * Hook para criar um novo pilar
 */
export const useCreateHealthPillar = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      type,
    }: {
      patientId: string
      planId: string
      type: HealthPillarType
    }) => {
      return await createHealthPillar(patientId, planId, type)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['health-pillars', variables.patientId, variables.planId],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'health-pillar',
          variables.patientId,
          variables.planId,
          variables.type,
        ],
      })
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao criar pilar de saúde')
    },
  })
}

