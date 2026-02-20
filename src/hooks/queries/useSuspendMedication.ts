import { useMutation, useQueryClient } from '@tanstack/react-query'

import { suspendMedication } from '@/services/medicaments'

interface SuspendMedicationData {
  userId: string
  medicationId: string
}

export const useSuspendMedication = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: SuspendMedicationData) => {
      return await suspendMedication(data.userId, data.medicationId)
    },
    onSuccess: () => {
      // Invalidar queries relacionadas aos medicamentos
      queryClient.invalidateQueries({ queryKey: ['active-medicaments'] })
      queryClient.invalidateQueries({ queryKey: ['all-medicaments'] })
    },
  })

  return mutation
}
