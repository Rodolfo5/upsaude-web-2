import { z } from 'zod'

export interface ResetPasswordFormData {
  newPassword: string
  confirmPassword: string
}

export interface PasswordRequirements {
  length: boolean
  hasLetter: boolean
  hasNumber: boolean
  noSpaces: boolean
  maxLength: boolean
}

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string({ required_error: 'Digite a senha' })
      .min(8, 'Deve ter no mínimo 8 caracteres')
      .max(32, 'Deve ter no máximo 32 caracteres')
      .regex(/^\S+$/g, 'Não pode conter espaços em branco')
      .regex(
        /^(?=.*\d)(?=.*[a-zA-Z]).{8,32}$/gm,
        'Deve conter ao menos uma letra e um número',
      ),
    confirmPassword: z.string({ required_error: 'Confirme a senha' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormDataSchema = z.infer<typeof resetPasswordSchema>
