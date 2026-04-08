import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createTrack,
  deleteTrack,
  getTrackById,
  getAllTracksByGoal,
  getAllTracksByPillar,
  updateTrack,
} from '@/services/healthPillarTrack'
import { TrackEntity } from '@/types/entities/healthPillar'

import { errorToast, successToast } from '../useAppToast'
import useDoctor from '../useDoctor'

import { useCreateAdjustment } from './useTherapeuticPlanAdjustments'

/**
 * Hook para buscar uma trilha específica por ID
 */
export const useTrack = (
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string | undefined,
  trackId: string,
) => {
  return useQuery({
    queryKey: ['track', patientId, planId, pillarId, trackId],
    queryFn: () => getTrackById(patientId, planId, pillarId, goalId, trackId),
    enabled:
      !!patientId &&
      !!planId &&
      !!pillarId &&
      !!trackId &&
      trackId !== 'new' &&
      planId !== 'new',
  })
}

/**
 * Hook para buscar todas as trilhas de um pilar
 */
export const useTracksByPillar = (
  patientId: string,
  planId: string,
  pillarId: string,
) => {
  return useQuery({
    queryKey: ['tracks-by-pillar', patientId, planId, pillarId],
    queryFn: () => getAllTracksByPillar(patientId, planId, pillarId),
    enabled: !!patientId && !!planId && !!pillarId && planId !== 'new',
  })
}

/**
 * Hook para buscar todas as trilhas de uma meta
 */
export const useTracks = (
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string,
) => {
  return useQuery({
    queryKey: ['tracks', patientId, planId, pillarId, goalId],
    queryFn: () => getAllTracksByGoal(patientId, planId, pillarId, goalId),
    enabled:
      !!patientId && !!planId && !!pillarId && !!goalId && planId !== 'new',
  })
}

/**
 * Hook para criar uma nova trilha
 */
export const useCreateTrack = () => {
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
      goalId?: string
      data: Partial<TrackEntity>
    }) => {
      return await createTrack(patientId, planId, pillarId, goalId, data)
    },
    onSuccess: async (_, variables) => {
      successToast('Trilha criada com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'tracks',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.goalId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'tracks-by-pillar',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: 'Trilha',
              title: 'Trilha criada',
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
      errorToast(error.message || 'Erro ao criar trilha')
    },
  })
}

/**
 * Hook para atualizar uma trilha existente
 */
export const useUpdateTrack = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      goalId,
      trackId,
      data,
    }: {
      patientId: string
      planId: string
      pillarId: string
      goalId?: string
      trackId: string
      data: Partial<TrackEntity>
    }) => {
      return await updateTrack(
        patientId,
        planId,
        pillarId,
        goalId,
        trackId,
        data,
      )
    },
    onSuccess: async (_, variables) => {
      successToast('Trilha atualizada com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'tracks',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.goalId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'tracks-by-pillar',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: 'Trilha',
              title: 'Trilha ajustada',
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
      errorToast(error.message || 'Erro ao atualizar trilha')
    },
  })
}

/**
 * Hook para deletar uma trilha
 */
export const useDeleteTrack = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      goalId,
      trackId,
    }: {
      patientId: string
      planId: string
      pillarId: string
      goalId: string
      trackId: string
    }) => {
      return await deleteTrack(patientId, planId, pillarId, goalId, trackId)
    },
    onSuccess: (_, variables) => {
      successToast('Trilha removida com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'tracks',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.goalId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'tracks-by-pillar',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao remover trilha')
    },
  })
}
