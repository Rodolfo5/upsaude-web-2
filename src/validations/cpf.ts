import { z } from 'zod'

// Função para validar CPF
function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '')

  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false

  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder

  if (parseInt(cpf.charAt(9)) !== digit1) return false

  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder

  return parseInt(cpf.charAt(10)) === digit2
}

export const cpfSchema = z
  .string()
  .min(1, 'CPF é obrigatório')
  .refine(
    (cpf) => {
      // Remove caracteres não numéricos antes de validar
      const cleanCpf = cpf.replace(/[^\d]/g, '')
      const isValid = validateCPF(cleanCpf)
      return isValid
    },
    {
      message: 'CPF inválido',
    },
  )

export default cpfSchema
