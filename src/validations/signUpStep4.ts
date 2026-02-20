import { z } from 'zod'

export const officeAddressSchema = z.object({
  cep: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  neighborhood: z.string().optional(),
  complement: z.string().optional(),
  address: z.string().optional(),
})

export const signUpStep4Schema = z.object({
  office: officeAddressSchema.optional(),
})

export type SignUpStep4Data = z.infer<typeof signUpStep4Schema>
export type OfficeAddressData = z.infer<typeof officeAddressSchema>
export default signUpStep4Schema
