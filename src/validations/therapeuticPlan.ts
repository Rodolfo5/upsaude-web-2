import { z } from 'zod'

export const therapeuticPlanSchema = z.object({
  objective: z
    .string()
    .min(1, 'O objetivo do plano é obrigatório')
    .min(10, 'O objetivo deve ter pelo menos 10 caracteres'),
  reevaluationPeriod: z
    .number()
    .min(1, 'O período deve ser maior que 0')
    .max(999, 'O período não pode ser maior que 999'),
  reevaluationPeriodUnit: z.enum(['Meses', 'Semanas', 'Dias'], {
    required_error: 'A unidade de tempo é obrigatória',
  }),
})

export type TherapeuticPlanFormData = z.infer<typeof therapeuticPlanSchema>

export default therapeuticPlanSchema
