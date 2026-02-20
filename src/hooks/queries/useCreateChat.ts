import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createChat } from '@/services/chat'

import { errorToast, successToast } from '../useAppToast'
import useUser from '../useUser'

import { getChatsByDoctorQueryKey } from './useChatsByDoctor'

export const useCreateChat = () => {
  const queryClient = useQueryClient()
  const { currentUser } = useUser()
  const mutation = useMutation({
    mutationFn: async ({
      patientId,
      doctorId,
    }: {
      patientId: string
      doctorId: string
    }) => {
      return await createChat({ patientId, doctorId })
    },
    onSuccess: (result) => {
      if (result.error) {
        errorToast(result.error)
      } else {
        successToast('Chat criado com sucesso!')
        // Invalidar queries de chats se necessário no futuro
        queryClient.invalidateQueries({
          queryKey: getChatsByDoctorQueryKey(currentUser?.id),
        })
      }
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao criar chat')
    },
  })

  return mutation
}
