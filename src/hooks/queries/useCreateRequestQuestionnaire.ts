import { useMutation, useQueryClient } from '@tanstack/react-query'

import { findDoctorById } from '@/services/doctor'
import {
  createRequestQuestionnaire,
  CreateRequestQuestionnaireData,
} from '@/services/requestQuestionnaires'

import { errorToast, successToast } from '../useAppToast'

import { useCreateTimelinePatientsForQuestionnaire } from './useTimelinePatients'

export const useCreateRequestQuestionnaire = () => {
  const queryClient = useQueryClient()
  const createTimelineMutation = useCreateTimelinePatientsForQuestionnaire()

  const mutation = useMutation({
    mutationFn: async (data: CreateRequestQuestionnaireData) => {
      return await createRequestQuestionnaire(data)
    },
    onSuccess: async (result, variables) => {
      if (result.error) {
        errorToast(result.error)
      } else {
        // Criar timelines para cada paciente selecionado
        try {
          // Buscar o nome do médico
          const doctor = await findDoctorById(variables.doctorId)
          const doctorName = doctor?.name || 'Médico'

          await createTimelineMutation.mutateAsync({
            patientIds: variables.patientIds,
            data: {
              title: `Dr(a). ${doctorName} solicitou um questionário`,
              createdBy: 'Doctor',
              type: 'Questionários de Saúde',
            },
          })
        } catch (error) {
          // Log do erro mas não impede o sucesso do questionário
          console.error('Erro ao criar timelines:', error)
        }

        successToast('Questionário aplicado com sucesso!')
        // Invalidar queries relacionadas se necessário
        queryClient.invalidateQueries({ queryKey: ['request-questionnaires'] })
      }
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao aplicar questionário')
    },
  })

  return mutation
}
