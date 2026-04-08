import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createTrainingPrescription,
  deleteTrainingPrescription,
  getTrainingPrescriptionsByActivityId,
  updateTrainingPrescription,
} from '@/services/healthPillarTrainingPrescription'
import { TrainingPrescriptionEntity } from '@/types/entities/healthPillar'

import { errorToast, successToast } from '../useAppToast'
import useDoctor from '../useDoctor'

import { useCreateAdjustment } from './useTherapeuticPlanAdjustments'

/**
 * Hook para buscar todas as prescrições de treino de uma atividade
 */
export const useTrainingPrescriptions = (
  patientId: string,
  planId: string,
  pillarId: string,
  activityId: string,
) => {
  return useQuery({
    queryKey: [
      'training-prescriptions',
      patientId,
      planId,
      pillarId,
      activityId,
    ],
    queryFn: () =>
      getTrainingPrescriptionsByActivityId(
        patientId,
        planId,
        pillarId,
        activityId,
      ),
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
 * Hook para criar uma nova prescrição de treino
 */
export const useCreateTrainingPrescription = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      activityId,
      data,
    }: {
      patientId: string
      planId: string
      pillarId: string
      activityId: string
      data: Partial<TrainingPrescriptionEntity>
    }) => {
      return await createTrainingPrescription(
        patientId,
        planId,
        pillarId,
        activityId,
        data,
      )
    },
    onSuccess: async (_, variables) => {
      successToast('Prescrição de treino criada com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'training-prescriptions',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.activityId,
        ],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: 'Prescrição de treino',
              title: 'Prescrição de treino criada',
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
      errorToast(error.message || 'Erro ao criar prescrição de treino')
    },
  })
}

/**
 * Hook para atualizar uma prescrição de treino existente
 */
export const useUpdateTrainingPrescription = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      activityId,
      prescriptionId,
      data,
    }: {
      patientId: string
      planId: string
      pillarId: string
      activityId: string
      prescriptionId: string
      data: Partial<TrainingPrescriptionEntity>
    }) => {
      return await updateTrainingPrescription(
        patientId,
        planId,
        pillarId,
        activityId,
        prescriptionId,
        data,
      )
    },
    onSuccess: async (_, variables) => {
      successToast('Prescrição de treino atualizada com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'training-prescriptions',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.activityId,
        ],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: 'Prescrição de treino',
              title: 'Prescrição de treino ajustada',
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
      errorToast(error.message || 'Erro ao atualizar prescrição de treino')
    },
  })
}

/**
 * Hook para deletar uma prescrição de treino
 */
export const useDeleteTrainingPrescription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      activityId,
      prescriptionId,
    }: {
      patientId: string
      planId: string
      pillarId: string
      activityId: string
      prescriptionId: string
    }) => {
      return await deleteTrainingPrescription(
        patientId,
        planId,
        pillarId,
        activityId,
        prescriptionId,
      )
    },
    onSuccess: (_, variables) => {
      successToast('Prescrição de treino removida com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'training-prescriptions',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.activityId,
        ],
      })
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao remover prescrição de treino')
    },
  })
}
