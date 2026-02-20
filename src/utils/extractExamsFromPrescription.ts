import { MemedExam, MemedPrescription } from '@/services/memed/types'
import { classifyMemedItem } from '@/utils/memedItemClassification'

/**
 * Normaliza um item para o formato MemedExam
 */
function normalizeExamItem(item: Record<string, unknown>): MemedExam {
  return {
    id: (item.id as string) || '',
    nome:
      (item.nome as string) ||
      (item.titulo as string) ||
      (item.name as string) ||
      '',
    posologia: item.posologia as string | undefined,
    instrucoes:
      (item.instrucoes as string) || (item.posologia as string) || undefined,
    observacoes: item.observacoes as string | undefined,
    tipo: (item.tipo as string) || 'exame',
    codigo_sus:
      (item.exames_sus_codigo as string) ||
      (item.codigo_sus as string) ||
      undefined,
    codigo_tuss:
      (item.exames_tuss_codigo as string) ||
      (item.codigo_tuss as string) ||
      undefined,
  }
}

/**
 * Extrai exames de uma prescrição da Memed
 *
 * Coleta exames de TODAS as fontes possíveis:
 * 1. Array `exames` separado na prescrição
 * 2. Array `medicamentos` filtrando itens classificados como exames
 *
 * Usa classifyMemedItem() para identificar exames pela:
 * - Presença de indicadores de exame (tipo, ID, códigos SUS/TUSS)
 * - AUSÊNCIA de características de medicamento (sem tarja, fabricante, etc.)
 *
 * Itens como "Hemoglobina" que não possuem tarja, fabricante, receituario,
 * forma farmacêutica são automaticamente classificados como exames.
 *
 * @param prescription - Prescrição da Memed
 * @returns Array de exames extraídos (sem duplicatas)
 */
export function extractExamsFromPrescription(
  prescription: MemedPrescription,
): MemedExam[] {
  const examsMap = new Map<string, MemedExam>()

  // 1. Coletar do array exames (se existir)
  if (Array.isArray(prescription.exames)) {
    const examesArray = prescription.exames as Array<Record<string, unknown>>
    examesArray.forEach((exame) => {
      const normalized = normalizeExamItem(exame)
      if (normalized.id || normalized.nome) {
        examsMap.set(normalized.id || normalized.nome, normalized)
      }
    })
  }

  // 2. Coletar do array medicamentos (exames misturados pela Memed)
  if (Array.isArray(prescription.medicamentos)) {
    prescription.medicamentos.forEach((medicamento) => {
      const medAsRecord = medicamento as Record<string, unknown>

      // Usar classifyMemedItem para identificar exames
      if (classifyMemedItem(medAsRecord) === 'exam') {
        const normalized = normalizeExamItem(medAsRecord)
        if (normalized.id || normalized.nome) {
          // Não sobrescrever se já existe (priorizar dados do array exames)
          if (!examsMap.has(normalized.id || normalized.nome)) {
            examsMap.set(normalized.id || normalized.nome, normalized)
          }
        }
      }
    })
  }

  return Array.from(examsMap.values())
}
