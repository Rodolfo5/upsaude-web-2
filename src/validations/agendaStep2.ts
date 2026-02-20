import { z } from 'zod'

import { WeekDay } from '@/constants/weekDays'

const ShiftConfigSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  consultationTypes: z.array(z.string()).optional(),
  format: z.array(z.string()).optional(),
  value: z.number().optional(),
  isPromotional: z.boolean().optional(),
})

const AgendaStep2Schema = z.object({
  selectedDays: z
    .array(z.nativeEnum(WeekDay))
    .min(1, 'Selecione pelo menos um dia da semana'),
  shifts: z
    .record(z.nativeEnum(WeekDay), z.array(ShiftConfigSchema))
    .optional(),
})

export type AgendaStep2Data = z.infer<typeof AgendaStep2Schema>
export type ShiftConfigData = z.infer<typeof ShiftConfigSchema>

export default AgendaStep2Schema
