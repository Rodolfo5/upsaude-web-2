import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateMedication } from '@/services/medication'
import type { MedicationEntity } from '@/types/entities/medication'

export function useUpdateMedication(patientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      medicationId,
      updates,
    }: {
      medicationId: string
      updates: Partial<MedicationEntity>
    }) => {
      await updateMedication(patientId, medicationId, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', patientId] })
    },
  })
}
