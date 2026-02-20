import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteUserDoc } from '@/services/user'

import { successToast } from '../useAppToast'

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (userId: string) => {
      return await deleteUserDoc(userId)
    },
    onSuccess: () => {
      successToast('Usuário excluído com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return mutation
}
