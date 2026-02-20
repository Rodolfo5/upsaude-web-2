import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createGoal,
  deleteGoal,
  getAllGoalsByPillar,
  updateGoal,
} from '@/services/healthPillarGoal'
import { GoalEntity } from '@/types/entities/healthPillar'
import {
  getGoalAdjustmentTitle,
  getGoalAdjustmentType,
} from '@/utils/therapeuticPlanAdjustments'

import { errorToast, successToast } from '../useAppToast'
import { useCreateAdjustment } from './useTherapeuticPlanAdjustments'
import useDoctor from '../useDoctor'

/**
 * Hook para buscar todas as metas de um pilar
 */
export const useGoals = (
  patientId: string,
  planId: string,
  pillarId: string,
) => {
  return useQuery({
    queryKey: ['goals', patientId, planId, pillarId],
    queryFn: () => getAllGoalsByPillar(patientId, planId, pillarId),
    enabled: !!patientId && !!planId && !!pillarId && planId !== 'new',
  })
}

/**
 * Hook para criar uma nova meta
 */
export const useCreateGoal = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      data,
    }: {
      patientId: string
      planId: string
      pillarId: string
      data: Partial<GoalEntity>
    }) => {
      return await createGoal(patientId, planId, pillarId, data)
    },
    onSuccess: async (_, variables) => {
      successToast('Meta criada com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['goals', variables.patientId, variables.planId, variables.pillarId],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: getGoalAdjustmentType(variables.data),
              title: getGoalAdjustmentTitle(variables.data, true),
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
      errorToast(error.message || 'Erro ao criar meta')
    },
  })
}

/**
 * Hook para atualizar uma meta existente
 */
export const useUpdateGoal = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      goalId,
      data,
    }: {
      patientId: string
      planId: string
      pillarId: string
      goalId: string
      data: Partial<GoalEntity>
    }) => {
      return await updateGoal(patientId, planId, pillarId, goalId, data)
    },
    onSuccess: async (_, variables) => {
      successToast('Meta atualizada com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['goals', variables.patientId, variables.planId, variables.pillarId],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: getGoalAdjustmentType(variables.data),
              title: getGoalAdjustmentTitle(variables.data, false),
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
      errorToast(error.message || 'Erro ao atualizar meta')
    },
  })
}

/**
 * Hook para deletar uma meta
 */
export const useDeleteGoal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      goalId,
    }: {
      patientId: string
      planId: string
      pillarId: string
      goalId: string
    }) => {
      return await deleteGoal(patientId, planId, pillarId, goalId)
    },
    onSuccess: (_, variables) => {
      successToast('Meta removida com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['goals', variables.patientId, variables.planId, variables.pillarId],
      })
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao remover meta')
    },
  })
}

