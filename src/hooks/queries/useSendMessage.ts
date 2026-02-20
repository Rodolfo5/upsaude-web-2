import { useMutation, useQueryClient } from '@tanstack/react-query'

import { sendMessage } from '@/services/message'

import { errorToast, successToast } from '../useAppToast'

export const useSendMessage = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({
      chatId,
      message,
    }: {
      chatId: string
      message: Omit<
        import('@/types/entities/message').MessageEntity,
        'id' | 'createdAt'
      > & { id?: string }
    }) => {
      return await sendMessage(chatId, message)
    },
    onSuccess: (result, variables) => {
      if (result.error) {
        errorToast(result.error)
      } else {
        // Invalidar queries de mensagens para atualizar a lista
        queryClient.invalidateQueries({
          queryKey: ['messages', variables.chatId],
        })
      }
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao enviar mensagem')
    },
  })

  return mutation
}
