import {
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import { MedicationDoseEntity } from '@/types/entities/medicationDose'

const firestore = getFirestore(firebaseApp)

/**
 * Busca todas as doses de um medicamento específico
 * @param userId - ID do usuário
 * @param medicationId - ID do medicamento
 * @returns Promise com array de doses
 */
export const getMedicationDoses = async (
  userId: string,
  medicationId: string,
): Promise<MedicationDoseEntity[]> => {
  if (!userId || !medicationId) {
    return []
  }

  try {
    // Referência para a subcoleção de doses do medicamento
    const dosesRef = collection(
      firestore,
      'users',
      userId,
      'medications',
      medicationId,
      'doses',
    )

    // Query para buscar todas as doses ordenadas por data de criação
    const q = query(dosesRef, orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)

    const doses: MedicationDoseEntity[] = []
    querySnapshot.forEach((doc) => {
      doses.push({
        id: doc.id,
        ...doc.data(),
      } as MedicationDoseEntity)
    })

    return doses
  } catch (error) {
    console.error('Erro ao buscar doses do medicamento:', error)
    return []
  }
}

/**
 * Busca doses de um medicamento dentro de um período específico
 * @param userId - ID do usuário
 * @param medicationId - ID do medicamento
 * @param startDate - Data de início
 * @param endDate - Data de fim
 * @returns Promise com array de doses no período
 */
export const getMedicationDosesInPeriod = async (
  userId: string,
  medicationId: string,
  startDate: Date,
  endDate: Date,
): Promise<MedicationDoseEntity[]> => {
  try {
    const allDoses = await getMedicationDoses(userId, medicationId)

    // Filtrar doses que estão no período especificado
    // O ID da dose contém a data/hora que deveria ser tomada no formato DD-MM-YYYY-HH-MM-SS
    const filteredDoses = allDoses.filter((dose: MedicationDoseEntity) => {
      try {
        // Extrair a data do ID da dose
        const parts = dose.id.split('-')
        if (parts.length < 6) {
          return false
        }
        const [day, month, year, hour, minute, second] = parts.map(Number)
        const doseScheduledDate = new Date(
          year,
          month - 1, // Mês é 0-indexado
          day,
          hour,
          minute,
          second || 0,
        )

        const isInPeriod =
          doseScheduledDate >= startDate && doseScheduledDate <= endDate

        return isInPeriod
      } catch (error) {
        console.error('Erro ao processar data da dose:', error)
        return false
      }
    })
    return filteredDoses
  } catch (error) {
    console.error('Erro em getMedicationDosesInPeriod:', error)
    return []
  }
}
