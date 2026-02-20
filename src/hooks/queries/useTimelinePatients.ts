import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createTimelinePatient,
  createTimelinePatientsForQuestionnaire,
  deleteTimelinePatient,
  findAllTimelinePatients,
  findTimelinePatientById,
  updateTimelinePatient,
} from '@/services/timelinePatient'
import type { TimelinePatientEntity } from '@/types/entities/timelinePatient'

import { errorToast, successToast } from '../useAppToast'

/**
 * Hook para buscar todos os timeline patients de um usuário
 */
export function useTimelinePatients(userId?: string) {
  return useQuery({
    queryKey: ['timelinePatients', userId],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required')
      }
      return findAllTimelinePatients(userId)
    },
    enabled: !!userId,
  })
}

/**
 * Hook para buscar um timeline patient específico por ID
 */
export function useTimelinePatientById(userId?: string, timelineId?: string) {
  return useQuery({
    queryKey: ['timelinePatient', userId, timelineId],
    queryFn: () => {
      if (!userId || !timelineId) {
        throw new Error('User ID and Timeline ID are required')
      }
      return findTimelinePatientById(userId, timelineId)
    },
    enabled: !!userId && !!timelineId,
  })
}

/**
 * Hook para criar um novo timeline patient
 */
export const useCreateTimelinePatient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string
      data: Partial<TimelinePatientEntity>
    }) => {
      return await createTimelinePatient(userId, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['timelinePatients', variables.userId],
      })
      successToast('Timeline criada com sucesso!')
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao criar timeline')
    },
  })
}

/**
 * Hook para atualizar um timeline patient
 */
export const useUpdateTimelinePatient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      timelineId,
      data,
    }: {
      userId: string
      timelineId: string
      data: Partial<TimelinePatientEntity>
    }) => {
      return await updateTimelinePatient(userId, timelineId, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['timelinePatients', variables.userId],
      })
      queryClient.invalidateQueries({
        queryKey: ['timelinePatient', variables.userId, variables.timelineId],
      })
      successToast('Timeline atualizada com sucesso!')
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao atualizar timeline')
    },
  })
}

/**
 * Hook para deletar um timeline patient
 */
export const useDeleteTimelinePatient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      timelineId,
    }: {
      userId: string
      timelineId: string
    }) => {
      return await deleteTimelinePatient(userId, timelineId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['timelinePatients', variables.userId],
      })
      successToast('Timeline deletada com sucesso!')
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao deletar timeline')
    },
  })
}

/**
 * Hook para criar múltiplas timeline patients para questionários
 */
export const useCreateTimelinePatientsForQuestionnaire = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientIds,
      data,
    }: {
      patientIds: string[]
      data: Omit<TimelinePatientEntity, 'id' | 'createdAt' | 'patientId'>
    }) => {
      return await createTimelinePatientsForQuestionnaire(patientIds, data)
    },
    onSuccess: (timelines, variables) => {
      // Invalidar queries de timeline para todos os pacientes afetados
      variables.patientIds.forEach((patientId) => {
        queryClient.invalidateQueries({
          queryKey: ['timelinePatients', patientId],
        })
      })
    },
    onError: (error: Error) => {
      console.error('Erro ao criar timelines para questionário:', error)
      // Não mostrar toast de erro aqui, pois será tratado no hook principal
    },
  })
}
