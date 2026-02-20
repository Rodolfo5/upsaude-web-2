import { z } from 'zod'

const RequestConsultationsSchema = z.object({
  specialty: z.string().min(1, 'Especialidade é obrigatória'),
  reason: z
    .string()
    .min(1, 'Motivo é obrigatório')
    .max(500, 'Motivo deve ter no máximo 500 caracteres'),
  frequencyValue: z.string().optional(),
  frequencyUnit: z.string().optional(),
  requiredConsultations: z.string().optional(),
  numberConsultations: z.string().min(1, 'Número de consultas é obrigatório'),
  isResponsible: z.boolean().optional(),
  doesNotRepeat: z.boolean().optional(),
})

export default RequestConsultationsSchema

export type RequestConsultationsData = z.infer<
  typeof RequestConsultationsSchema
>
