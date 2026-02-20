import { z } from 'zod'

export const biomarkerSchema = z.object({
  type: z.enum(
    ['bloodGlucose', 'bloodPressure', 'heartRate', 'oximetry', 'temperature'],
    {
      required_error: 'O tipo de biomarcador é obrigatório',
    },
  ),
  minValue: z
    .string()
    .min(1, 'O valor mínimo é obrigatório')
    .min(1, 'O valor mínimo deve ter pelo menos 1 caractere'),
  maxValue: z
    .string()
    .min(1, 'O valor máximo é obrigatório')
    .min(1, 'O valor máximo deve ter pelo menos 1 caractere'),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
})

export type BiomarkerFormData = z.infer<typeof biomarkerSchema>

export default biomarkerSchema
