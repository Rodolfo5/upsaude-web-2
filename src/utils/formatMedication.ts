import { Timestamp } from 'firebase/firestore'

import {
  MedicationEntity,
  MedicationStatus,
  MedicationCreationBy,
} from '@/types/entities/medication'

/**
 * Formata o nome do medicamento com dosagem
 * Exemplo: "Dipirona 500mg"
 */
export function formatMedicationName(medication: MedicationEntity): string {
  const concentration =
    medication.concentration && medication.concentrationUnit
      ? ` ${medication.concentration}${medication.concentrationUnit}`
      : ''
  return `${medication.name}${concentration}`
}

/**
 * Remove tags HTML de uma string
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Formata as orientações de uso do medicamento
 * Exemplo: "Tomar 1 comprimido, 3 vezes ao dia"
 */
export function formatInstructions(medication: MedicationEntity): string {
  const parts: string[] = []

  if (medication.observation) {
    // Remove tags HTML do observation antes de adicionar
    parts.push(stripHtml(medication.observation))
  }

  if (medication.dose && medication.doseUnit) {
    parts.push(`${medication.dose} ${medication.doseUnit}`)
  }

  if (medication.interval && medication.intervalUnit) {
    const times =
      medication.intervalUnit === 'Horas'
        ? 24 / medication.interval
        : medication.intervalUnit === 'Dias'
          ? medication.interval
          : 1
    parts.push(`${times} vez${times > 1 ? 'es' : ''} ao dia`)
  }

  return parts.join(', ') || '-'
}

/**
 * Calcula a duração do tratamento entre duas datas
 */
export function calculateDuration(
  startDate: string | Timestamp | undefined,
  endDate: string | Timestamp | undefined,
): string {
  if (!startDate || !endDate) {
    return 'duração não especificada'
  }

  try {
    const convertDate = (date: string | Timestamp): Date => {
      if (typeof date === 'string') {
        return new Date(date)
      }
      if (
        typeof date === 'object' &&
        date !== null &&
        'toDate' in date &&
        typeof (date as { toDate: unknown }).toDate === 'function'
      ) {
        return (date as { toDate: () => Date }).toDate()
      }
      return new Date()
    }

    const start = convertDate(startDate)
    const end = convertDate(endDate)

    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 28) {
      const months = Math.round(diffDays / 30)
      return months === 1 ? '1 mês' : `${months} meses`
    }

    if (diffDays > 7) {
      const weeks = Math.round(diffDays / 7)
      return weeks === 1 ? '1 semana' : `${weeks} semanas`
    }

    return diffDays === 1 ? '1 dia' : `${diffDays} dias`
  } catch (error) {
    console.error('Erro ao calcular duração:', error)
    return 'duração não especificada'
  }
}

/**
 * Formata a dosagem completa incluindo duração se necessário
 */
export function formatDosage(medication: MedicationEntity): string {
  const parts: string[] = []

  if (medication.dose && medication.doseUnit) {
    parts.push(`${medication.dose} ${medication.doseUnit}`)
  }

  if (medication.interval && medication.intervalUnit) {
    if (medication.intervalUnit === 'Horas') {
      parts.push(`a cada ${medication.interval} ${medication.intervalUnit}`)
    } else if (medication.intervalUnit === 'Dias') {
      parts.push(`${medication.interval}x ao dia`)
    } else {
      parts.push(`${medication.interval}x ao ${medication.intervalUnit}`)
    }
  }

  // Para uso contínuo, não incluir informações de duração
  if (medication.usageClassification !== 'Uso contínuo') {
    if (medication.startDate && medication.endDate) {
      const duration = calculateDuration(
        medication.startDate,
        medication.endDate,
      )
      parts.push(`durante ${duration}`)
    } else if (medication.startDate) {
      const startDateStr = medication.startDate || 'data não especificada'
      parts.push(`desde ${startDateStr}`)
    }
  }

  return parts.join(', ') || 'Dosagem não especificada'
}

/**
 * Retorna o label e cor do badge de status
 */
export function getStatusBadge(status: MedicationStatus): {
  label: string
  className: string
} {
  switch (status) {
    case MedicationStatus.ACTIVE:
      return {
        label: 'Ativo',
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
      }
    case MedicationStatus.SUSPENDED:
      return {
        label: 'Suspenso',
        className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
      }
    case MedicationStatus.CLOSED:
      return {
        label: 'Encerrado',
        className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
      }
    default:
      return {
        label: 'Criado',
        className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
      }
  }
}

/**
 * Retorna o label do badge de tipo
 */
export function getTypeBadge(
  createdBy: MedicationCreationBy,
  memedId?: string,
): {
  label: string
  className: string
} {
  // Se tem memedId, foi prescrito via Memed
  if (memedId) {
    return {
      label: 'Prescrito via Memed',
      className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
    }
  }

  switch (createdBy) {
    case MedicationCreationBy.DOCTOR:
      return {
        label: 'Prescrito',
        className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
      }
    case MedicationCreationBy.PATIENT:
      return {
        label: 'Cadastrado',
        className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
      }
    default:
      return {
        label: 'Cadastrado',
        className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
      }
  }
}
