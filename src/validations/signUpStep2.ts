import { z } from 'zod'

import birthDate from './birthDate'
import cpf from './cpf'

export const signUpStep2Schema = z.object({
  cpf,
  birthDate,
  state: z.string().min(1, 'Estado é obrigatório'),
  profileImage: z.string().optional(),
  minibio: z
    .string()
    .min(1, 'A minibio é obrigatória')
    .max(200, 'A minibio deve ter no máximo 200 caracteres'),
})

export type SignUpStep2Data = z.infer<typeof signUpStep2Schema>
export default signUpStep2Schema
