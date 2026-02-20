import { z } from 'zod'

export const birthDateSchema = z
  .date({
    required_error: 'Data de nascimento é obrigatória',
    invalid_type_error: 'Data inválida',
  })
  .refine(
    (date) => {
      const today = new Date()
      const age = today.getFullYear() - date.getFullYear()
      const monthDiff = today.getMonth() - date.getMonth()

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < date.getDate())
      ) {
        return age - 1 >= 18
      }

      return age >= 18
    },
    {
      message: 'Você deve ter pelo menos 18 anos',
    },
  )

export default birthDateSchema
