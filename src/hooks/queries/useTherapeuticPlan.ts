import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createTherapeuticPlan,
  getAllTherapeuticPlansByPatient,
  getTherapeuticPlanById,
  updateTherapeuticPlan,
} from '@/services/therapeuticPlan'
import { TherapeuticPlanEntity } from '@/types/entities/therapeuticPlan'

import { errorToast, successToast } from '../useAppToast'
import { useCreateAdjustment } from './useTherapeuticPlanAdjustments'
import useDoctor from '../useDoctor'

/**
 * Hook para buscar um plano terapêutico específico
 */
export const useTherapeuticPlan = (patientId: string, planId: string) => {
  return useQuery({
    queryKey: ['therapeutic-plan', patientId, planId],
    queryFn: () => getTherapeuticPlanById(patientId, planId),
    enabled: !!patientId && !!planId && planId !== 'new',
  })
}

/**
 * Hook para buscar todos os planos terapêuticos de um paciente
 */
export const useTherapeuticPlans = (patientId: string) => {
  return useQuery({
    queryKey: ['therapeutic-plans', patientId],
    queryFn: () => getAllTherapeuticPlansByPatient(patientId),
    enabled: !!patientId,
  })
}

/**
 * Hook para buscar o plano terapêutico atual (mais recente que não foi dado alta)
 */
export const useCurrentTherapeuticPlan = (patientId: string) => {
  return useQuery({
    queryKey: ['current-therapeutic-plan', patientId],
    queryFn: async () => {
      const plans = await getAllTherapeuticPlansByPatient(patientId)
      // Retornar o plano mais recente que não foi dado alta
      return plans.find((plan) => !plan.dischargedAt) || null
    },
    enabled: !!patientId,
  })
}

/**
 * Retorna true se o paciente já recebeu alta de algum plano terapêutico
 */
export const useHasDischargedPlan = (patientId: string) => {
  const { data: plans = [] } = useTherapeuticPlans(patientId)
  return plans.some((plan) => !!plan.dischargedAt)
}

/**
 * Hook para criar um novo plano terapêutico
 */
export const useCreateTherapeuticPlan = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      data,
    }: {
      patientId: string
      data: Partial<TherapeuticPlanEntity>
    }) => {
      return await createTherapeuticPlan(patientId, data)
    },
    onSuccess: async (result, variables) => {
      successToast('Plano terapêutico criado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['therapeutic-plans', variables.patientId],
      })
      queryClient.invalidateQueries({
        queryKey: ['therapeutic-plan', variables.patientId, result.id],
      })

      // Registrar ajuste
      if (currentDoctor) {
        try {
          await createAdjustment({
            patientId: variables.patientId,
            planId: result.id,
            data: {
              adjustmentType: 'Plano terapêutico',
              title: 'Plano terapêutico criado',
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
      errorToast(error.message || 'Erro ao criar plano terapêutico')
    },
  })
}

/**
 * Hook para atualizar um plano terapêutico existente
 */
export const useUpdateTherapeuticPlan = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      data,
    }: {
      patientId: string
      planId: string
      data: Partial<TherapeuticPlanEntity>
    }) => {
      return await updateTherapeuticPlan(patientId, planId, data)
    },
    onSuccess: async (_, variables) => {
      successToast('Plano terapêutico atualizado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['therapeutic-plans', variables.patientId],
      })
      queryClient.invalidateQueries({
        queryKey: ['therapeutic-plan', variables.patientId, variables.planId],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: 'Plano terapêutico',
              title: 'Definições do plano ajustadas',
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
      errorToast(error.message || 'Erro ao atualizar plano terapêutico')
    },
  })
}

