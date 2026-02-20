import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createDoctor } from '@/services/doctor'

interface CreateDoctorData {
  name: string
  email: string
  cpf: string
  birthDate: Date
  state: string
  crm?: string
  crmState?: string
  specialty?: string
}

export const useCreateDoctor = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateDoctorData) => {
      return await createDoctor(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return mutation
}
