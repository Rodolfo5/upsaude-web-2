import { z } from 'zod'

import email from './email'
import password from './password'

const SignInFormSchema = z.object({
  email,
  password,
})

export default SignInFormSchema
export type SignInFormData = z.infer<typeof SignInFormSchema>
