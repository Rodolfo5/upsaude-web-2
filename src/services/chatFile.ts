import { uploadFile } from '@/services/firebase/firebaseStorage'

interface UploadResult {
  url: string | null
  error: string | null
}

/**
 * Faz upload de um arquivo PDF para o chat
 */
export const uploadChatFile = async (
  file: File,
  chatId: string,
): Promise<UploadResult> => {
  // Validar que é PDF
  if (
    file.type !== 'application/pdf' &&
    !file.name.toLowerCase().endsWith('.pdf')
  ) {
    return {
      url: null,
      error: 'Apenas arquivos PDF são permitidos',
    }
  }

  // Validar tamanho (máximo 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      url: null,
      error: 'Arquivo muito grande. Máximo 10MB',
    }
  }

  try {
    const result = await uploadFile(file, `chats/${chatId}/files`)
    return result
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo do chat:', error)
    return {
      url: null,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao fazer upload do arquivo',
    }
  }
}
