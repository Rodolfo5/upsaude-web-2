import { z } from 'zod'

export default z
  .string({ required_error: 'Insira um número de telefone' })
  .min(10, 'Número de telefone muito curto')
  .max(15, 'Número de telefone muito longo')
  .regex(/^\+?[1-9]\d{1,14}$/, 'Número de telefone inválido')
  .transform((value) => value.replace(/\s+/g, '').trim())
