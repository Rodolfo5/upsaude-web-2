import { MemedMedication, MemedPrescription } from '@/services/memed/types'
import { classifyMemedItem } from '@/utils/memedItemClassification'

/**
 * Extrai apenas medicamentos de uma prescrição da Memed
 *
 * Usa classifyMemedItem() para identificar positivamente medicamentos
 * pela presença de campos específicos (tarja, receituario, fabricante, etc.).
 *
 * Itens sem essas características (ex: "Hemoglobina") são tratados como exames
 * e NÃO são incluídos. Use extractExamsFromPrescription() para esses itens.
 *
 * @param prescription - Prescrição da Memed com array de medicamentos
 * @returns Array de medicamentos extraídos (excluindo exames)
 */
export function extractMedicationsFromPrescription(
  prescription: MemedPrescription,
): MemedMedication[] {
  const medications: MemedMedication[] = []

  if (Array.isArray(prescription.medicamentos)) {
    medications.push(
      ...prescription.medicamentos.filter((medicamento) => {
        const medAsRecord = medicamento as Record<string, unknown>
        return classifyMemedItem(medAsRecord) === 'medication'
      }),
    )
  }

  return medications
}
