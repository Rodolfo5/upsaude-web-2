import { z } from 'zod'

import email from './email'

const ForgotPasswordSchema = z.object({
  email,
})

export default ForgotPasswordSchema
export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>
