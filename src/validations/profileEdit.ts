import { z } from 'zod'

import birthDate from './birthDate'
import cpf from './cpf'
import name from './name'

export const profileEditSchema = z.object({
  // Dados Pessoais (opcionais - só valida se existir)
  name: name.optional(),
  cpf: cpf.optional(),
  birthDate: birthDate.optional(),
  state: z.string().optional(),

  // Credencial de Saúde (opcionais - só valida se existir)
  typeOfCredential: z.string().optional(),
  credential: z.string().optional(),
  specialty: z.string().optional(),
  credentialDocument: z.string().optional(),

  // Localização do Consultório (opcionais - só valida se existir)
  office: z
    .object({
      address: z.string().optional(),
      neighborhood: z.string().optional(),
      complement: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      cep: z.string().optional(),
    })
    .optional(),

  // Foto de perfil
  profileImage: z.instanceof(File).optional(),
})

export type ProfileEditData = z.infer<typeof profileEditSchema>
export default profileEditSchema
