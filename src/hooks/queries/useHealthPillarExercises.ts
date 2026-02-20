import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createExercise,
  deleteExercise,
  getAllExercisesByTrack,
  updateExercise,
} from '@/services/healthPillarExercise'
import { ExerciseEntity } from '@/types/entities/healthPillar'

import { errorToast, successToast } from '../useAppToast'
import { useCreateAdjustment } from './useTherapeuticPlanAdjustments'
import useDoctor from '../useDoctor'

export const useExercisesByTrack = (
  patientId: string,
  planId: string,
  pillarId: string,
  trackId: string,
) => {
  return useQuery({
    queryKey: ['exercises-by-track', patientId, planId, pillarId, trackId],
    queryFn: () => getAllExercisesByTrack(patientId, planId, pillarId, trackId),
    enabled:
      !!patientId &&
      !!planId &&
      !!pillarId &&
      !!trackId &&
      planId !== 'new' &&
      trackId !== 'new',
  })
}

export const useCreateExercise = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      trackId,
      data,
    }: {
      patientId: string
      planId: string
      pillarId: string
      trackId: string
      data: Partial<ExerciseEntity>
    }) => {
      return await createExercise(patientId, planId, pillarId, trackId, data)
    },
    onSuccess: async (_, variables) => {
      successToast('Exercício criado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'exercises-by-track',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.trackId,
        ],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: 'Exercício',
              title: 'Exercício criado',
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
      errorToast(error.message || 'Erro ao criar exercício')
    },
  })
}

export const useUpdateExercise = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      trackId,
      exerciseId,
      data,
    }: {
      patientId: string
      planId: string
      pillarId: string
      trackId: string
      exerciseId: string
      data: Partial<ExerciseEntity>
    }) => {
      return await updateExercise(
        patientId,
        planId,
        pillarId,
        trackId,
        exerciseId,
        data,
      )
    },
    onSuccess: async (_, variables) => {
      successToast('Exercício atualizado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'exercises-by-track',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.trackId,
        ],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: 'Exercício',
              title: 'Exercício ajustado',
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
      errorToast(error.message || 'Erro ao atualizar exercício')
    },
  })
}

export const useDeleteExercise = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      trackId,
      exerciseId,
    }: {
      patientId: string
      planId: string
      pillarId: string
      trackId: string
      exerciseId: string
    }) => {
      return await deleteExercise(
        patientId,
        planId,
        pillarId,
        trackId,
        exerciseId,
      )
    },
    onSuccess: (_, variables) => {
      successToast('Exercício removido com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'exercises-by-track',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.trackId,
        ],
      })
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao remover exercício')
    },
  })
}
