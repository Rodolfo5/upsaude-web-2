import { MemedMedication, MemedPrescription } from '@/services/memed/types'
import { classifyMemedItem } from '@/utils/memedItemClassification'

function normalizeMedicationFromAny(
  med: Record<string, unknown>,
): MemedMedication {
  const posologiaHtml = med.posologia as string | undefined
  const posologiaSanitizada = med.sanitized_posology as string | undefined
  const posologiaFinal = posologiaSanitizada || posologiaHtml

  return {
    id: (med.id as string) || '',
    nome:
      (med.titulo as string) ||
      (med.nome as string) ||
      (med.name as string) ||
      '',
    posologia: posologiaFinal,
    apresentacao:
      (med.subtitulo as string) ||
      (med.apresentacao as string) ||
      (med.descricao as string) ||
      (med.presentation as string),
    forma_farmaceutica:
      (med.forma_farmaceutica as string) ||
      (med.pharmaceutical_form as string) ||
      (med.singular as string),
    via: (med.via as string) || undefined,
    quantidade:
      med.quantidade !== undefined && med.quantidade !== null
        ? typeof med.quantidade === 'number'
          ? med.quantidade.toString()
          : (med.quantidade as string)
        : undefined,
    duracao: (med.duracao as string) || (med.duration as string),
    frequencia: (med.frequencia as string) || (med.frequency as string),
    instrucoes: (med.instrucoes as string) || (med.instructions as string),
    receituario: med.receituario as string | undefined,
    tarja: med.tarja as string | undefined,
    unit: med.unit as string | undefined,
  }
}

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
