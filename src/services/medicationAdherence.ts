import { Timestamp } from 'firebase/firestore'

import { getActiveMedicaments } from '@/services/medicaments'
import { getMedicationDoses } from '@/services/medicationDoses'
import { MedicationEntity } from '@/types/entities/medicaments'
import {
  DoseStatus,
  MedicationDoseEntity,
} from '@/types/entities/medicationDose'

export interface MedicationAdherenceResult {
  isAdhering: boolean
  error: string | null
}

function toDate(value: Timestamp | Date | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate()
  }
  return null
}

/**
 * Verifica se o medicamento está dentro do período de uso (para Tratamento)
 */
function isMedicationInUsePeriod(medication: MedicationEntity): boolean {
  const now = new Date()

  if (medication.usageClassification === 'Uso contínuo') {
    return true
  }

  if (medication.usageClassification === 'Tratamento') {
    const startDate = toDate(medication.startDate)
    const endDate = toDate(medication.endDate)
    if (startDate && now < startDate) return false
    if (endDate && now > endDate) return false
    return true
  }

  return false
}

/**
 * Busca e calcula se o paciente está aderindo à medicação.
 * Paciente está aderindo apenas se TODAS as doses de medicamentos em uso
 * (Uso contínuo ou dentro do período) tiverem status "tomei".
 * Qualquer dose com "adiei" ou "ignorei" = não está aderindo.
 */
export async function getMedicationAdherence(
  patientId: string,
): Promise<MedicationAdherenceResult> {
  if (!patientId) {
    return { isAdhering: true, error: null }
  }

  try {
    const result = await getActiveMedicaments(patientId)
    if (result.error) {
      return { isAdhering: true, error: result.error }
    }

    const activeMedications = result.medicaments
    const medicationsToCheck = activeMedications.filter(isMedicationInUsePeriod)

    if (medicationsToCheck.length === 0) {
      return { isAdhering: true, error: null }
    }

    for (const medication of medicationsToCheck) {
      const doses: MedicationDoseEntity[] = await getMedicationDoses(
        patientId,
        medication.id,
      )

      const hasNonAdherence = doses.some(
        (dose) =>
          dose.status === DoseStatus.IGNORED ||
          dose.status === DoseStatus.DELAYED,
      )
      if (hasNonAdherence) {
        return { isAdhering: false, error: null }
      }
    }

    return { isAdhering: true, error: null }
  } catch (error) {
    console.error('Erro ao verificar adesão à medicação:', error)
    return {
      isAdhering: true,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}
