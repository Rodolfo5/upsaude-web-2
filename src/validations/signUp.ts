import { z } from 'zod'

import email from './email'
import name from './name'
import password from './password'

// Regex para validação de senha mais robusta
// const passwordRegex =
//   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

const SignUpFormSchema = z
  .object({
    name,
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não são iguais',
    path: ['confirmPassword'],
  })

export default SignUpFormSchema
export type SignUpFormData = z.infer<typeof SignUpFormSchema>
