import { Timestamp } from 'firebase/firestore'

import { MedicationEntity } from '@/types/entities/medication'

/**
 * Interface para dados brutos do Firestore que podem estar incompletos
 */
export interface RawMedicationData {
  id?: string
  userId?: string
  name?: string
  image?: string
  usageClassification?: string
  pharmaceuticalForm?: string
  observation?: string
  concentration?: number
  concentrationUnit?: string
  stock?: number
  stockUnit?: string
  dose?: number
  doseUnit?: string
  interval?: number
  intervalUnit?: string
  startDate?: string | Timestamp | Date
  endDate?: string | Timestamp | Date
  prescriber?: string
  otherPrescriber?: string
  attachment?: string
  prescriptionDate?: string | Timestamp | Date
  memedId?: string
  memedUrl?: string
  medicationReminder?: Array<{
    id: string
    time: number
    timeUnit: string
  }>
  inventoryReminder?: Array<{
    id: string
    time: number
  }>
  status?: string
  createdBy?: string
  methodOfMeasurement?: string
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
  [key: string]: unknown
}

/**
 * Converte datas do Firestore para o formato esperado pela aplicação
 */
function normalizeDate(
  value: string | Timestamp | Date | undefined,
): string | undefined {
  if (!value) return undefined

  try {
    // Se for Timestamp do Firestore
    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as { toDate: unknown }).toDate === 'function'
    ) {
      return (value as { toDate: () => Date }).toDate().toISOString()
    }

    // Se for Date
    if (value instanceof Date) {
      return value.toISOString()
    }

    // Se for string, retorna como está
    if (typeof value === 'string') {
      return value
    }
  } catch (error) {
    console.error('Erro ao normalizar data:', error)
  }

  return undefined
}

/**
 * Extrai dose e unidade de uma string de posologia
 * Exemplo: "1 comprimido" -> { dose: 1, unit: "comprimido" }
 */
function extractDoseFromPosology(posology?: string): {
  dose?: number
  unit?: string
} {
  if (!posology) return {}

  // Padrões comuns: "1 comprimido", "2 gotas", "5ml", etc.
  const match = posology.match(/(\d+)\s*([a-záàâãéèêíïóôõöúçñ]+)/i)
  if (match) {
    return {
      dose: parseInt(match[1], 10),
      unit: match[2],
    }
  }

  return {}
}

/**
 * Extrai intervalo de uma string de posologia
 * Exemplo: "a cada 8 horas" -> { interval: 8, unit: "Horas" }
 * Exemplo: "3x ao dia" -> { interval: 3, unit: "Dias" }
 */
function extractIntervalFromPosology(posology?: string): {
  interval?: number
  unit?: string
} {
  if (!posology) return {}

  // Padrão: "a cada X horas"
  const hoursMatch = posology.match(/a cada\s*(\d+)\s*(hora|horas)/i)
  if (hoursMatch) {
    return {
      interval: parseInt(hoursMatch[1], 10),
      unit: 'Horas',
    }
  }

  // Padrão: "Xx ao dia" ou "X vezes ao dia"
  const timesPerDayMatch = posology.match(/(\d+)\s*(?:x|vezes)\s*ao\s*dia/i)
  if (timesPerDayMatch) {
    return {
      interval: parseInt(timesPerDayMatch[1], 10),
      unit: 'Dias',
    }
  }

  // Padrão: "de X em X horas"
  const everyXHoursMatch = posology.match(/de\s*(\d+)\s*em\s*\d+\s*hora/i)
  if (everyXHoursMatch) {
    return {
      interval: parseInt(everyXHoursMatch[1], 10),
      unit: 'Horas',
    }
  }

  return {}
}

/**
 * Extrai concentração e unidade da apresentação
 * Exemplo: "500mg" -> { concentration: 500, unit: "mg" }
 */
function extractConcentrationFromPresentation(presentation?: string): {
  concentration?: number
  unit?: string
} {
  if (!presentation) return {}

  const match = presentation.match(/(\d+)\s*([a-záàâãéèêíïóôõöúçñ]+)/i)
  if (match) {
    return {
      concentration: parseInt(match[1], 10),
      unit: match[2],
    }
  }

  return {}
}

/**
 * Normaliza dados de medicamento do Firestore para garantir consistência
 * Preenche campos vazios com defaults apropriados e padroniza formatos
 */
export function normalizeMedication(
  rawData: RawMedicationData,
): MedicationEntity {
  // Extrair informações da posologia (observation) se disponível
  const posologyInfo = extractDoseFromPosology(rawData.observation)
  const intervalInfo = extractIntervalFromPosology(rawData.observation)
  const concentrationInfo = extractConcentrationFromPresentation(
    rawData.pharmaceuticalForm,
  )

  // Determinar dose e doseUnit
  let dose = rawData.dose
  let doseUnit = rawData.doseUnit

  if (!dose && posologyInfo.dose) {
    dose = posologyInfo.dose
  }
  if (!doseUnit && posologyInfo.unit) {
    doseUnit = posologyInfo.unit
  }

  // Defaults para dose
  if (!dose || dose === 0) {
    dose = 1
  }
  if (!doseUnit) {
    doseUnit = 'unidade'
  }

  // Determinar interval e intervalUnit
  let interval = rawData.interval
  let intervalUnit = rawData.intervalUnit

  if (!interval && intervalInfo.interval) {
    interval = intervalInfo.interval
  }
  if (!intervalUnit && intervalInfo.unit) {
    intervalUnit = intervalInfo.unit
  }

  // Determinar concentration e concentrationUnit
  let concentration = rawData.concentration
  let concentrationUnit = rawData.concentrationUnit

  if (!concentration && concentrationInfo.concentration) {
    concentration = concentrationInfo.concentration
  }
  if (!concentrationUnit && concentrationInfo.unit) {
    concentrationUnit = concentrationInfo.unit
  }

  // Defaults para concentration
  if (!concentration || concentration === 0) {
    concentration = 0
  }
  if (!concentrationUnit) {
    concentrationUnit = ''
  }

  // Normalizar usageClassification
  let usageClassification = rawData.usageClassification || ''
  if (!usageClassification && rawData.memedId) {
    // Se veio da Memed e não tem classificação, assumir uso contínuo se não tiver endDate
    usageClassification = rawData.endDate ? '' : 'Uso contínuo'
  }

  // Normalizar datas
  const startDate = normalizeDate(rawData.startDate)
  const endDate = normalizeDate(rawData.endDate)
  const prescriptionDate = normalizeDate(rawData.prescriptionDate)

  // Converter createdAt e updatedAt para Timestamp
  const now = Timestamp.now()
  let createdAt = now
  let updatedAt = now

  if (rawData.createdAt) {
    if (rawData.createdAt instanceof Timestamp) {
      createdAt = rawData.createdAt
    } else if (rawData.createdAt instanceof Date) {
      createdAt = Timestamp.fromDate(rawData.createdAt)
    }
  }

  if (rawData.updatedAt) {
    if (rawData.updatedAt instanceof Timestamp) {
      updatedAt = rawData.updatedAt
    } else if (rawData.updatedAt instanceof Date) {
      updatedAt = Timestamp.fromDate(rawData.updatedAt)
    }
  }

  return {
    id: rawData.id || '',
    userId: rawData.userId || '',
    name: rawData.name || '',
    image: rawData.image || '',
    usageClassification,
    pharmaceuticalForm: rawData.pharmaceuticalForm || '',
    observation: rawData.observation,
    concentration,
    concentrationUnit,
    stock: rawData.stock ?? 0,
    stockUnit: rawData.stockUnit || '',
    dose,
    doseUnit,
    interval,
    intervalUnit,
    startDate,
    endDate,
    prescriber: rawData.prescriber,
    otherPrescriber: rawData.otherPrescriber,
    attachment: rawData.attachment,
    prescriptionDate,
    memedId: rawData.memedId,
    memedUrl: rawData.memedUrl,
    medicationReminder: rawData.medicationReminder || [],
    inventoryReminder: rawData.inventoryReminder || [],
    status: (rawData.status as any) || 'ACTIVE',
    createdBy: (rawData.createdBy as any) || 'DOCTOR',
    methodOfMeasurement: rawData.methodOfMeasurement,
    createdAt,
    updatedAt,
  }
}

/**
 * Normaliza um array de medicamentos
 */
export function normalizeMedications(
  rawDataArray: RawMedicationData[],
): MedicationEntity[] {
  return rawDataArray.map((rawData) => normalizeMedication(rawData))
}
