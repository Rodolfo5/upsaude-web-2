import { FirebaseError } from 'firebase/app'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import { AbsenceEntity, CreateAbsenceData } from '@/types/entities/absence'

const db = getFirestore(firebaseApp)

interface AbsencesResult {
  absences: AbsenceEntity[]
  error: string | null
}

interface OperationResult {
  success: boolean
  error: string | null
}

export const saveAbsence = async (
  doctorId: string,
  absenceData: CreateAbsenceData,
): Promise<OperationResult> => {
  if (!doctorId) {
    return {
      success: false,
      error: 'ID do médico é obrigatório',
    }
  }

  try {
    const absencesRef = collection(db, 'users', doctorId, 'absences')

    await addDoc(absencesRef, {
      doctorId,
      date: Timestamp.fromDate(absenceData.date),
      startHour: absenceData.startHour,
      endHour: absenceData.endHour,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    return {
      success: true,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao salvar ausência:', error)

    if (error instanceof FirebaseError) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao salvar ausência',
    }
  }
}

export const getAbsences = async (
  doctorId: string,
): Promise<AbsencesResult> => {
  if (!doctorId) {
    return {
      absences: [],
      error: 'ID do médico é obrigatório',
    }
  }

  try {
    const absencesRef = collection(db, 'users', doctorId, 'absences')
    const q = query(absencesRef, orderBy('date', 'desc'))

    const querySnapshot = await getDocs(q)

    const absences: AbsenceEntity[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      absences.push({
        id: doc.id,
        doctorId: data.doctorId || doctorId,
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        startHour: data.startHour || '',
        endHour: data.endHour || '',
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: data.updatedAt || Timestamp.now(),
      })
    })

    return {
      absences,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao buscar ausências:', error)

    if (error instanceof FirebaseError) {
      return {
        absences: [],
        error: error.message,
      }
    }

    return {
      absences: [],
      error:
        error instanceof Error ? error.message : 'Erro ao buscar ausências',
    }
  }
}

export const deleteAbsence = async (
  doctorId: string,
  absenceId: string,
): Promise<OperationResult> => {
  if (!doctorId || !absenceId) {
    return {
      success: false,
      error: 'ID do médico e da ausência são obrigatórios',
    }
  }

  try {
    const absenceRef = doc(db, 'users', doctorId, 'absences', absenceId)
    await deleteDoc(absenceRef)

    return {
      success: true,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao deletar ausência:', error)

    if (error instanceof FirebaseError) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Erro ao deletar ausência',
    }
  }
}
