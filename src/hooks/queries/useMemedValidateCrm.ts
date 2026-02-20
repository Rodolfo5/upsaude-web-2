import { useMutation } from '@tanstack/react-query'

interface ValidateCrmData {
  crm: string
  crmState: string
  skipMemedValidation?: boolean // Se true, valida apenas uso local, não valida na Memed
  excludeUserId?: string // ID do usuário a ser excluído da verificação (útil quando o CRM já foi salvo)
}

interface ValidateCrmResponse {
  valid: boolean
  memedId?: string
  doctor?: {
    name?: string
    crm?: string
    crmState?: string
    specialty?: string
  }
  error?: string
  inUse?: boolean // Indica se o CRM já está sendo usado no banco de dados local
  inUseBy?: {
    id: string
    name: string
    email: string
  } // Informações do médico que já usa o CRM
}

export const useMemedValidateCrm = () => {
  const mutation = useMutation<ValidateCrmResponse, Error, ValidateCrmData>({
    mutationFn: async (data: ValidateCrmData) => {
      try {
        const response = await fetch('/api/memed/validate-crm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
          // Se a resposta tem um campo 'error', retornamos como resposta normal
          // para que o componente possa exibir a mensagem
          return {
            valid: false,
            error: result.error || 'Erro ao validar CRM',
          }
        }

        return result
      } catch (error) {
        console.error('Erro na validação de CRM:', error)
        return {
          valid: false,
          error:
            error instanceof Error
              ? error.message
              : 'Erro ao conectar com o servidor',
        }
      }
    },
  })

  return mutation
}
