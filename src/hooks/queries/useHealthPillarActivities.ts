import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createActivity,
  deleteActivity,
  getAllActivitiesByGoal,
  getAllActivitiesByPillar,
  getActivityById,
  updateActivity,
} from '@/services/healthPillarActivity'
import { ActivityEntity } from '@/types/entities/healthPillar'
import { getActivityAdjustmentTitle } from '@/utils/therapeuticPlanAdjustments'

import { getCategoryById } from '../../services/healthPillarLifestyleCategory'
import { errorToast, successToast } from '../useAppToast'
import useDoctor from '../useDoctor'

import { useCreateAdjustment } from './useTherapeuticPlanAdjustments'

/**
 * Hook para buscar todas as atividades de um pilar
 */
export const useActivitiesByPillar = (
  patientId: string,
  planId: string,
  pillarId: string,
) => {
  return useQuery({
    queryKey: ['activities-by-pillar', patientId, planId, pillarId],
    queryFn: () => getAllActivitiesByPillar(patientId, planId, pillarId),
    enabled: !!patientId && !!planId && !!pillarId && planId !== 'new',
  })
}

/**
 * Hook para buscar todas as atividades de uma meta
 */
export const useActivities = (
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string,
) => {
  return useQuery({
    queryKey: ['activities', patientId, planId, pillarId, goalId],
    queryFn: () => getAllActivitiesByGoal(patientId, planId, pillarId, goalId),
    enabled:
      !!patientId && !!planId && !!pillarId && !!goalId && planId !== 'new',
  })
}

/**
 * Hook para buscar uma atividade específica por ID
 */
export const useActivity = (
  patientId: string,
  planId: string,
  pillarId: string,
  activityId: string,
) => {
  return useQuery({
    queryKey: ['activity', patientId, planId, pillarId, activityId],
    queryFn: () => getActivityById(patientId, planId, pillarId, activityId),
    enabled:
      !!patientId &&
      !!planId &&
      !!pillarId &&
      !!activityId &&
      planId !== 'new' &&
      activityId !== 'new',
  })
}

/**
 * Hook para criar uma nova atividade
 */
export const useCreateActivity = () => {
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
      data: Partial<ActivityEntity>
    }) => {
      return await createActivity(patientId, planId, pillarId, goalId, data)
    },
    onSuccess: async (_, variables) => {
      successToast('Atividade criada com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'activities',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.goalId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'activities-by-pillar',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          // Tentar identificar o tipo de categoria se for estilo de vida
          let categoryType: string | undefined
          try {
            const category = await getCategoryById(
              variables.patientId,
              variables.planId,
              variables.pillarId,
              variables.goalId,
            )
            categoryType = category?.type
          } catch {
            // Se não for categoria, ignora
          }

          const title = getActivityAdjustmentTitle(
            variables.data,
            categoryType,
            true,
          )

          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: 'Atividade',
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
      errorToast(error.message || 'Erro ao criar atividade')
    },
  })
}

/**
 * Hook para atualizar uma atividade existente
 */
export const useUpdateActivity = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      goalId,
      activityId,
      data,
    }: {
      patientId: string
      planId: string
      pillarId: string
      goalId: string
      activityId: string
      data: Partial<ActivityEntity>
    }) => {
      return await updateActivity(
        patientId,
        planId,
        pillarId,
        goalId,
        activityId,
        data,
      )
    },
    onSuccess: async (_, variables) => {
      successToast('Atividade atualizada com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'activities',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.goalId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'activities-by-pillar',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          // Tentar identificar o tipo de categoria se for estilo de vida
          let categoryType: string | undefined
          try {
            const category = await getCategoryById(
              variables.patientId,
              variables.planId,
              variables.pillarId,
              variables.goalId,
            )
            categoryType = category?.type
          } catch {
            // Se não for categoria, ignora
          }

          const title = getActivityAdjustmentTitle(
            variables.data,
            categoryType,
            false,
          )

          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: 'Atividade',
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
      errorToast(error.message || 'Erro ao atualizar atividade')
    },
  })
}

/**
 * Hook para deletar uma atividade
 */
export const useDeleteActivity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      goalId,
      activityId,
    }: {
      patientId: string
      planId: string
      pillarId: string
      goalId: string
      activityId: string
    }) => {
      return await deleteActivity(
        patientId,
        planId,
        pillarId,
        goalId,
        activityId,
      )
    },
    onSuccess: (_, variables) => {
      successToast('Atividade removida com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'activities',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.goalId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'activities-by-pillar',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao remover atividade')
    },
  })
}
