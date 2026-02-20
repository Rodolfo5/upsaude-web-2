import { parse } from 'date-fns'

/**
 * Converte um ID de formato dd-MM-yyyy-HH-mm-ss para um objeto Date
 * @param id - ID a ser convertido
 * @returns Date ou null se a conversão falhar
 */
export function parseDateFromId(id: string): Date | null {
  const parsed = parse(id, 'dd-MM-yyyy-HH-mm-ss', new Date())
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}
