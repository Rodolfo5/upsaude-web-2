import { z } from 'zod'

const AgendaSchema = z.object({
  complementaryConsultationDuration: z
    .number({
      required_error: 'Selecione a duração da consulta complementar',
      invalid_type_error: 'Duração inválida',
    })
    .min(15, 'A duração mínima é de 15 minutos')
    .positive('Selecione uma duração válida'),
})

export type AgendaData = z.infer<typeof AgendaSchema>

export default AgendaSchema
