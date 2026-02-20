import { z } from 'zod'

export const diagnosticSchema = z.object({
  name: z
    .string()
    .min(1, 'O nome do diagnóstico é obrigatório')
    .min(2, 'O nome deve ter pelo menos 2 caracteres'),
  cid: z
    .string()
    .min(1, 'O código CID é obrigatório')
    .regex(/^[A-Z0-9.-]+$/i, 'CID deve conter apenas letras, números, pontos e hífens'),
  category: z.enum(['Agudo', 'Crônico', 'Recorrente', 'Suspeita'], {
    required_error: 'A categoria é obrigatória',
  }),
  status: z.enum(['Ativo', 'Resolvido', 'Descartado', 'Em remissão'], {
    required_error: 'O status é obrigatório',
  }),
})

export type DiagnosticFormData = z.infer<typeof diagnosticSchema>

export default diagnosticSchema

