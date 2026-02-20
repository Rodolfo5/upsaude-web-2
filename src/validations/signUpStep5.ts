import { z } from 'zod'

export const officeSchema = z.object({
  cep: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  neighborhood: z.string().optional(),
  complement: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  workingHours: z.string().optional(),
})

export const signUpStep5Schema = z.object({
  office: officeSchema.optional(),
  agenda: z.string().optional(),
})

export type SignUpStep5Data = z.infer<typeof signUpStep5Schema>
export type OfficeData = z.infer<typeof officeSchema>
export default signUpStep5Schema
