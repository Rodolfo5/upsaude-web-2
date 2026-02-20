import { clsx, type ClassValue } from 'clsx'
import { Timestamp } from 'firebase/firestore'
import { twMerge } from 'tailwind-merge'
import { v4 as uuidv4 } from 'uuid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatcep(cep: string) {
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2')
}

export function formatCpf(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export const timestampToDate = (data: Timestamp): Date | null => {
  if (typeof data === 'string') {
    // Converte para Date e ajusta para GMT-3 (Brasília)
    const date = new Date(data)
    // Ajusta o horário subtraindo 3 horas (em milissegundos)
    return date
  } else {
    if (!data || typeof data.seconds !== 'number') {
      return null
    }
    const milliseconds = data.seconds * 1000 + (data.nanoseconds || 0) / 1000000
    return new Date(milliseconds)
  }
}

const MEDICAL_RECORD_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/medical-record-share`

export function generateMedicalRecordShareUrl(patientId: string): string {
  const token = uuidv4()

  const base = `${MEDICAL_RECORD_BASE_URL}?patientId=${encodeURIComponent(
    patientId,
  )}&token=${encodeURIComponent(token)}`

  return base
}
