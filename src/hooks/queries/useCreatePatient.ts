import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createPatient } from '@/services/patient'

interface CreatePatientData {
  name: string
  email: string
  phone: string
  doctorId: string
  steps: string
}

export const useCreatePatient = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreatePatientData) => {
      return await createPatient(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['classified-patients'] })
      queryClient.invalidateQueries({ queryKey: ['patients-acompanhamento'] })
    },
  })

  return mutation
}
