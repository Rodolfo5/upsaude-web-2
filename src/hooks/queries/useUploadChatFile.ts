import { useMutation } from '@tanstack/react-query'

import { uploadChatFile } from '@/services/chatFile'

import { errorToast } from '../useAppToast'

interface UploadChatFileParams {
  file: File
  chatId: string
}

export const useUploadChatFile = () => {
  const mutation = useMutation({
    mutationFn: async ({ file, chatId }: UploadChatFileParams) => {
      return await uploadChatFile(file, chatId)
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao fazer upload do arquivo')
    },
  })

  return mutation
}

