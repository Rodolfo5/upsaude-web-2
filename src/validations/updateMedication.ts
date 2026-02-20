import { z } from 'zod'

const usageClassificationValues = [
  'Uso contínuo',
  'Tratamento',
  'Sintomático',
] as const

const intervalUnitValues = ['Horas', 'Dias'] as const

export const updateMedicationSchema = z
  .object({
    usageClassification: z.enum(usageClassificationValues),
    interval: z.preprocess(
      (value) => {
        if (value === '' || value === null || value === undefined) {
          return undefined
        }
        const parsed = Number(value)
        return Number.isNaN(parsed) ? undefined : parsed
      },
      z.number().int().positive().optional(),
    ),
    intervalUnit: z.enum(intervalUnitValues).optional(),
    endDate: z.preprocess(
      (value) => {
        if (value instanceof Date) return value
        if (!value) return undefined
        const parsed = new Date(value as string)
        return Number.isNaN(parsed.getTime()) ? undefined : parsed
      },
      z.date().optional(),
    ),
  })
  .refine(
    (data) => {
      if (
        data.usageClassification === 'Uso contínuo' ||
        data.usageClassification === 'Tratamento'
      ) {
        return data.interval !== undefined && data.intervalUnit !== undefined
      }
      return true
    },
    {
      message:
        'Intervalo e unidade são obrigatórios para Uso contínuo e Tratamento',
      path: ['interval'],
    },
  )
  .refine(
    (data) => {
      if (data.usageClassification === 'Tratamento') {
        return data.endDate !== undefined
      }
      return true
    },
    {
      message: 'Data de término é obrigatória para Tratamento',
      path: ['endDate'],
    },
  )
