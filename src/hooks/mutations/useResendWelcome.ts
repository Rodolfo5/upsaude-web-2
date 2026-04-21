import { useMutation } from '@tanstack/react-query'

import { getApiErrorMessage, postAuthenticatedJson } from '@/services/api/authenticatedFetch'

export const useResendWelcome = () => {
  return useMutation({
    mutationFn: async (patientId: string) => {
      const { response, data } = await postAuthenticatedJson<{
        success: boolean
        error: string | null
        warnings: string[]
      }>('/api/resend-welcome', { patientId })

      if (!response.ok || !data?.success) {
        throw new Error(getApiErrorMessage(data, 'Erro ao reenviar boas-vindas.'))
      }

      return data
    },
  })
}
