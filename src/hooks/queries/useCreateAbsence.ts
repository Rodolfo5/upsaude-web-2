import { useMutation, useQueryClient } from '@tanstack/react-query'

import { saveAbsence } from '@/services/absence'
import { CreateAbsenceData } from '@/types/entities/absence'

import { getAbsencesQueryKey } from './useAbsences'

interface CreateAbsenceMutationData {
  doctorId: string
  absenceData: CreateAbsenceData
}

export const useCreateAbsence = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ doctorId, absenceData }: CreateAbsenceMutationData) =>
      saveAbsence(doctorId, absenceData),
    onSuccess: (_, variables) => {
      // Invalida a query de ausências para recarregar a lista
      queryClient.invalidateQueries({
        queryKey: getAbsencesQueryKey(variables.doctorId),
      })
    },
  })
}
