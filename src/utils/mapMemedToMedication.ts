import type { MemedMedication } from '@/services/memed/types'
import type { MedicationEntity } from '@/types/entities/medication'
import {
  MedicationStatus,
  MedicationCreationBy,
} from '@/types/entities/medication'

/**
 * Mapeia dados de um medicamento da Memed para a estrutura de MedicationEntity
 *
 * Extrai apenas os dados relevantes do medicamento prescrito pela Memed
 * e converte para o formato esperado pela entidade medications do Firestore
 *
 * @param memedMed - Medicamento no formato Memed
 * @param patientId - ID do paciente
 * @param doctorName - Nome do médico prescritor
 * @param prescriptionDate - Data da prescrição
 * @param memedPrescriptionId - ID da prescrição na Memed (opcional)
 * @param memedUrl - URL da prescrição na Memed (opcional)
 * @returns Dados parciais da MedicationEntity prontos para criação
 */
export function mapMemedToMedication(
  memedMed: MemedMedication,
  patientId: string,
  doctorName: string,
  prescriptionDate: Date,
  memedPrescriptionId?: string,
  memedUrl?: string,
): Partial<MedicationEntity> {
  // Extrair posologia/instrução do medicamento
  const posologia =
    (memedMed.posologia as string) || (memedMed.instrucoes as string) || ''

  // Extrair forma farmacêutica
  const pharmaceuticalForm =
    memedMed.forma_farmaceutica || (memedMed.apresentacao as string) || ''

  // Extrair classificação de uso (receituário)
  const usageClassification = memedMed.receituario || 'Simples'

  return {
    userId: patientId,
    name: memedMed.nome || '',
    image: '',
    observation: posologia,
    pharmaceuticalForm,
    usageClassification,
    concentration: 0,
    concentrationUnit: '',
    stock: 0,
    stockUnit: '',
    dose: 0,
    doseUnit: '',
    prescriber: doctorName,
    prescriptionDate: prescriptionDate.toISOString(),
    memedId: memedPrescriptionId,
    memedUrl,
    status: MedicationStatus.ACTIVE,
    createdBy: MedicationCreationBy.DOCTOR,
  }
}
