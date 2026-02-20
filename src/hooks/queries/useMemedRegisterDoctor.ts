import { useMutation } from '@tanstack/react-query'

interface RegisterDoctorData {
  externalId?: string
  name: string
  surname: string
  email: string
  cpf: string
  birthDate: string
  crm: string
  crmState: string
  specialty?: string
}

interface RegisterDoctorResponse {
  success: boolean
  memedId?: string
  prescriberToken?: string
  error?: string
}

export const useMemedRegisterDoctor = () => {
  const mutation = useMutation<
    RegisterDoctorResponse,
    Error,
    RegisterDoctorData
  >({
    mutationFn: async (data: RegisterDoctorData) => {
      const response = await fetch('/api/memed/register-doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      // Se a resposta não for ok, retornar resultado com success: false
      // em vez de lançar erro, para que o componente possa verificar o status
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Erro ao cadastrar médico na Memed',
        }
      }

      // Garantir que sempre retorna a estrutura esperada
      return {
        success: result.success ?? true,
        memedId: result.memedId,
        prescriberToken: result.prescriberToken,
        error: result.error,
      }
    },
  })

  return mutation
}
