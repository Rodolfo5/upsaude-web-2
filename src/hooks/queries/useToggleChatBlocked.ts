import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toggleChatBlocked } from '@/services/chat'

import { errorToast, successToast } from '../useAppToast'
import useUser from '../useUser'

import { getChatsByDoctorQueryKey } from './useChatsByDoctor'

export const useToggleChatBlocked = () => {
  const queryClient = useQueryClient()
  const { currentUser } = useUser()

  const mutation = useMutation({
    mutationFn: async (chatId: string) => {
      return await toggleChatBlocked(chatId)
    },
    onSuccess: (result) => {
      if (result.error) {
        errorToast(result.error)
      } else {
        successToast('Status do chat atualizado com sucesso!')
        queryClient.invalidateQueries({
          queryKey: getChatsByDoctorQueryKey(currentUser?.id),
        })
      }
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao atualizar status do chat')
    },
  })

  return mutation
}
