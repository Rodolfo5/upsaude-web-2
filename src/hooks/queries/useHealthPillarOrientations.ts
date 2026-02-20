import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createOrientation,
  deleteOrientation,
  getAllOrientationsByGoal,
  getAllOrientationsByPillar,
  getOrientationById,
  updateOrientation,
} from '@/services/healthPillarOrientation'
import { OrientationEntity } from '@/types/entities/healthPillar'

import { errorToast, successToast } from '../useAppToast'
import { useCreateAdjustment } from './useTherapeuticPlanAdjustments'
import useDoctor from '../useDoctor'
import { getOrientationAdjustmentTitle } from '@/utils/therapeuticPlanAdjustments'

/**
 * Hook para buscar uma orientação específica por ID
 */
export const useOrientation = (
  patientId: string,
  planId: string,
  pillarId: string,
  orientationId: string,
) => {
  return useQuery({
    queryKey: ['orientation', patientId, planId, pillarId, orientationId],
    queryFn: () =>
      getOrientationById(patientId, planId, pillarId, orientationId),
    enabled:
      !!patientId &&
      !!planId &&
      !!pillarId &&
      !!orientationId &&
      planId !== 'new' &&
      orientationId !== 'new',
  })
}

/**
 * Hook para buscar todas as orientações de um pilar
 */
export const useOrientationsByPillar = (
  patientId: string,
  planId: string,
  pillarId: string,
) => {
  return useQuery({
    queryKey: ['orientations-by-pillar', patientId, planId, pillarId],
    queryFn: () => getAllOrientationsByPillar(patientId, planId, pillarId),
    enabled: !!patientId && !!planId && !!pillarId && planId !== 'new',
  })
}

/**
 * Hook para buscar todas as orientações de uma meta
 */
export const useOrientations = (
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string,
) => {
  return useQuery({
    queryKey: ['orientations', patientId, planId, pillarId, goalId],
    queryFn: () =>
      getAllOrientationsByGoal(patientId, planId, pillarId, goalId),
    enabled:
      !!patientId && !!planId && !!pillarId && !!goalId && planId !== 'new',
  })
}

/**
 * Hook para criar uma nova orientação
 */
export const useCreateOrientation = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      goalId,
      isRead,
      data,
    }: {
      patientId: string
      planId: string
      pillarId: string
      goalId: string
      isRead: boolean
      data: Partial<OrientationEntity>
    }) => {
      return await createOrientation(
        patientId,
        planId,
        pillarId,
        goalId,
        isRead,
        data,
      )
    },
    onSuccess: async (_, variables) => {
      successToast('Orientação criada com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'orientations',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.goalId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'orientations-by-pillar',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          const title = getOrientationAdjustmentTitle(
            { ...variables.data, area: variables.data.area },
            true,
          )

          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: 'Orientação',
              title,
              doctorId: currentDoctor.id,
              doctorName: currentDoctor.name || 'Médico',
            },
          })
        } catch (error) {
          console.error('Erro ao registrar ajuste:', error)
        }
      }
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao criar orientação')
    },
  })
}

/**
 * Hook para atualizar uma orientação existente
 */
export const useUpdateOrientation = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      goalId,
      orientationId,
      data,
    }: {
      patientId: string
      planId: string
      pillarId: string
      goalId: string
      orientationId: string
      data: Partial<OrientationEntity>
    }) => {
      return await updateOrientation(
        patientId,
        planId,
        pillarId,
        goalId,
        orientationId,
        data,
      )
    },
    onSuccess: async (_, variables) => {
      successToast('Orientação atualizada com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'orientations',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.goalId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'orientations-by-pillar',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          const title = getOrientationAdjustmentTitle(variables.data, false)

          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: 'Orientação',
              title,
              doctorId: currentDoctor.id,
              doctorName: currentDoctor.name || 'Médico',
            },
          })
        } catch (error) {
          console.error('Erro ao registrar ajuste:', error)
        }
      }
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao atualizar orientação')
    },
  })
}

/**
 * Hook para deletar uma orientação
 */
export const useDeleteOrientation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      goalId,
      orientationId,
    }: {
      patientId: string
      planId: string
      pillarId: string
      goalId: string
      orientationId: string
    }) => {
      return await deleteOrientation(
        patientId,
        planId,
        pillarId,
        goalId,
        orientationId,
      )
    },
    onSuccess: (_, variables) => {
      successToast('Orientação removida com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'orientations',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.goalId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'orientations-by-pillar',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao remover orientação')
    },
  })
}
