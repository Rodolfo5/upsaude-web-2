import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createDiagnostic,
  deleteDiagnostic,
  getAllDiagnosticsByPlan,
  getDiagnosticById,
  updateDiagnostic,
} from '@/services/diagnostic'
import { DiagnosticEntity } from '@/types/entities/diagnostic'

import { errorToast, successToast } from '../useAppToast'
import { useCreateAdjustment } from './useTherapeuticPlanAdjustments'
import useDoctor from '../useDoctor'

/**
 * Hook para buscar todos os diagnósticos de um plano terapêutico
 */
export const useDiagnostics = (patientId: string, planId: string) => {
  return useQuery({
    queryKey: ['diagnostics', patientId, planId],
    queryFn: () => getAllDiagnosticsByPlan(patientId, planId),
    enabled: !!patientId && !!planId && planId !== 'new',
  })
}

/**
 * Hook para buscar um diagnóstico específico
 */
export const useDiagnostic = (
  patientId: string,
  planId: string,
  diagnosticId: string,
) => {
  return useQuery({
    queryKey: ['diagnostic', patientId, planId, diagnosticId],
    queryFn: () => getDiagnosticById(patientId, planId, diagnosticId),
    enabled: !!patientId && !!planId && !!diagnosticId,
  })
}

/**
 * Hook para criar um novo diagnóstico
 */
export const useCreateDiagnostic = () => {
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
      data: Partial<DiagnosticEntity>
    }) => {
      return await createDiagnostic(patientId, planId, data)
    },
    onSuccess: async (_, variables) => {
      successToast('Diagnóstico cadastrado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['diagnostics', variables.patientId, variables.planId],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: 'Diagnóstico',
              title: 'Diagnóstico criado',
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
      errorToast(error.message || 'Erro ao cadastrar diagnóstico')
    },
  })
}

/**
 * Hook para atualizar um diagnóstico existente
 */
export const useUpdateDiagnostic = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      diagnosticId,
      data,
    }: {
      patientId: string
      planId: string
      diagnosticId: string
      data: Partial<DiagnosticEntity>
    }) => {
      return await updateDiagnostic(patientId, planId, diagnosticId, data)
    },
    onSuccess: async (_, variables) => {
      successToast('Diagnóstico atualizado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['diagnostics', variables.patientId, variables.planId],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'diagnostic',
          variables.patientId,
          variables.planId,
          variables.diagnosticId,
        ],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: 'Diagnóstico',
              title: 'Diagnóstico ajustado',
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
      errorToast(error.message || 'Erro ao atualizar diagnóstico')
    },
  })
}

/**
 * Hook para deletar um diagnóstico
 */
export const useDeleteDiagnostic = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      diagnosticId,
    }: {
      patientId: string
      planId: string
      diagnosticId: string
    }) => {
      return await deleteDiagnostic(patientId, planId, diagnosticId)
    },
    onSuccess: (_, variables) => {
      successToast('Diagnóstico removido com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['diagnostics', variables.patientId, variables.planId],
      })
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao remover diagnóstico')
    },
  })
}

