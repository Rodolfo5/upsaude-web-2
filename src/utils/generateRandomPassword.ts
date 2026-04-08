/**
 * Gera uma senha aleatória de 8 caracteres com pelo menos um número, uma letra maiúscula e uma letra minúscula.
 */
export const generateRandomPassword = (): string => {
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const specialChars = '!@#$%^&*'
  const allChars = upperChars + lowerChars + numbers + specialChars

  let password = ''
  password += upperChars.charAt(Math.floor(Math.random() * upperChars.length))
  password += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length))
  password += numbers.charAt(Math.floor(Math.random() * numbers.length))

  for (let i = 3; i < 8; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length))
  }

  return password
}
