import { z } from 'zod'

import { isValidSpecialtyForCredential } from '@/utils/specialtyHelpers'

export const signUpStep3Schema = z
  .object({
    typeOfCredential: z.string().min(1, 'Tipo de credencial é obrigatório'),
    credential: z.string().min(1, 'Credencial é obrigatória'),
    credentialState: z.string().optional(),
    specialty: z.string().min(1, 'Especialidade é obrigatória'),
    credentialDocument: z.string().optional(),
  })
  .refine(
    (data) =>
      isValidSpecialtyForCredential(data.specialty, data.typeOfCredential),
    {
      message: 'Especialidade inválida para o tipo de credencial selecionado',
      path: ['specialty'],
    },
  )

export type SignUpStep3Data = z.infer<typeof signUpStep3Schema>
export default signUpStep3Schema
