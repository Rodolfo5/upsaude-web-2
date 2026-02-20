import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createLifestyleCategory,
  deleteCategory,
  getAllCategoriesByPillar,
  getCategoryByType,
  updateCategory,
} from '@/services/healthPillarLifestyleCategory'
import { LifestyleCategoryEntity } from '@/types/entities/healthPillar'

import { errorToast, successToast } from '../useAppToast'
import { useCreateAdjustment } from './useTherapeuticPlanAdjustments'
import useDoctor from '../useDoctor'
import { getCategoryAdjustmentTitle } from '@/utils/therapeuticPlanAdjustments'

export const useLifestyleCategories = (
  patientId: string,
  planId: string,
  pillarId: string,
) => {
  return useQuery({
    queryKey: ['lifestyleCategories', patientId, planId, pillarId],
    queryFn: () => getAllCategoriesByPillar(patientId, planId, pillarId),
    enabled: !!patientId && !!planId && !!pillarId && planId !== 'new',
  })
}

export const useLifestyleCategoryByType = (
  patientId: string,
  planId: string,
  pillarId: string,
  type: string,
) => {
  return useQuery({
    queryKey: ['lifestyleCategory', patientId, planId, pillarId, type],
    queryFn: () => getCategoryByType(patientId, planId, pillarId, type),
    enabled:
      !!patientId && !!planId && !!pillarId && !!type && planId !== 'new',
  })
}

export const useCreateLifestyleCategory = () => {
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
      data: Partial<LifestyleCategoryEntity>
    }) => {
      return await createLifestyleCategory(patientId, planId, pillarId, data)
    },
    onSuccess: async (_, variables) => {
      successToast('Categoria criada com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'lifestyleCategories',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          const title = getCategoryAdjustmentTitle(variables.data, true)

          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: variables.data.type || 'Categoria',
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
      errorToast(error.message || 'Erro ao criar categoria')
    },
  })
}

export const useUpdateLifestyleCategory = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      categoryId,
      data,
    }: {
      patientId: string
      planId: string
      pillarId: string
      categoryId: string
      data: Partial<LifestyleCategoryEntity>
    }) => {
      return await updateCategory(patientId, planId, pillarId, categoryId, data)
    },
    onSuccess: async (_, variables) => {
      successToast('Categoria atualizada com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'lifestyleCategories',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          const title = getCategoryAdjustmentTitle(variables.data, false)

          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: variables.data.type || 'Categoria',
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
      errorToast(error.message || 'Erro ao atualizar categoria')
    },
  })
}

export const useDeleteLifestyleCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      categoryId,
    }: {
      patientId: string
      planId: string
      pillarId: string
      categoryId: string
    }) => {
      return await deleteCategory(patientId, planId, pillarId, categoryId)
    },
    onSuccess: (_, variables) => {
      successToast('Categoria removida com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'lifestyleCategories',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao remover categoria')
    },
  })
}
