import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteAbsence } from '@/services/absence'

import { getAbsencesQueryKey } from './useAbsences'

interface DeleteAbsenceMutationData {
  doctorId: string
  absenceId: string
}

export const useDeleteAbsence = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ doctorId, absenceId }: DeleteAbsenceMutationData) =>
      deleteAbsence(doctorId, absenceId),
    onSuccess: (_, variables) => {
      // Invalida a query de ausências para recarregar a lista
      queryClient.invalidateQueries({
        queryKey: getAbsencesQueryKey(variables.doctorId),
      })
    },
  })
}
