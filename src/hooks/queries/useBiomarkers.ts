import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createBiomarker,
  deleteBiomarker,
  getAllBiomarkersByPillar,
  getBiomarkerById,
  updateBiomarker,
} from '@/services/biomarker'
import { BiomarkerEntity } from '@/types/entities/biomarker'

import { errorToast, successToast } from '../useAppToast'
import { useCreateAdjustment } from './useTherapeuticPlanAdjustments'
import useDoctor from '../useDoctor'

export const useBiomarkersByPillar = (
  patientId: string,
  planId: string,
  pillarId: string,
) => {
  return useQuery({
    queryKey: ['biomarkers', patientId, planId, pillarId],
    queryFn: () => getAllBiomarkersByPillar(patientId, planId, pillarId),
    enabled: !!patientId && !!planId && !!pillarId && planId !== 'new',
  })
}

export const useBiomarker = (
  patientId: string,
  planId: string,
  pillarId: string,
  biomarkerId: string,
) => {
  return useQuery({
    queryKey: ['biomarker', patientId, planId, pillarId, biomarkerId],
    queryFn: () => getBiomarkerById(patientId, planId, pillarId, biomarkerId),
    enabled:
      !!patientId &&
      !!planId &&
      !!pillarId &&
      !!biomarkerId &&
      planId !== 'new',
  })
}

export const useCreateBiomarker = () => {
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
      data: Partial<BiomarkerEntity>
    }) => {
      return await createBiomarker(patientId, planId, pillarId, data)
    },
    onSuccess: async (_, variables) => {
      successToast('Biomarcador criado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'biomarkers',
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
              adjustmentType: 'Biomarcador',
              title: 'Biomarcador criado',
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
      errorToast(error.message || 'Erro ao criar biomarcador')
    },
  })
}

export const useUpdateBiomarker = () => {
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { mutateAsync: createAdjustment } = useCreateAdjustment()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      biomarkerId,
      data,
    }: {
      patientId: string
      planId: string
      pillarId: string
      biomarkerId: string
      data: Partial<BiomarkerEntity>
    }) => {
      return await updateBiomarker(
        patientId,
        planId,
        pillarId,
        biomarkerId,
        data,
      )
    },
    onSuccess: async (_, variables) => {
      successToast('Biomarcador atualizado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'biomarkers',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'biomarker',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.biomarkerId,
        ],
      })

      // Registrar ajuste
      if (currentDoctor && variables.planId !== 'new') {
        try {
          await createAdjustment({
            patientId: variables.patientId,
            planId: variables.planId,
            data: {
              adjustmentType: 'Biomarcador',
              title: 'Biomarcador ajustado',
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
      errorToast(error.message || 'Erro ao atualizar biomarcador')
    },
  })
}

export const useDeleteBiomarker = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      biomarkerId,
    }: {
      patientId: string
      planId: string
      pillarId: string
      biomarkerId: string
    }) => {
      return await deleteBiomarker(patientId, planId, pillarId, biomarkerId)
    },
    onSuccess: (_, variables) => {
      successToast('Biomarcador removido com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'biomarkers',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao remover biomarcador')
    },
  })
}
