import { z } from 'zod'

import email from './email'
import name from './name'
import password from './password'

export const signUpStep1Schema = z
  .object({
    name,
    email,
    password,
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não são iguais',
    path: ['confirmPassword'],
  })

export type SignUpStep1Data = z.infer<typeof signUpStep1Schema>
export default signUpStep1Schema
