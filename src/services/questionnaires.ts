import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import type { QuestionnaireEntity } from '@/types/entities/questionnaireEntity'

const firestore = getFirestore(firebaseApp)

/**
 * Busca um questionário específico por ID
 */
export async function findQuestionnaireById(
  questionnaireId: string,
): Promise<QuestionnaireEntity | null> {
  try {
    const docRef = doc(firestore, 'questionnaires', questionnaireId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) return null

    const data = docSnap.data() as Omit<QuestionnaireEntity, 'id'>
    return {
      id: docSnap.id,
      ...data,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
      updatedAt:
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : data.updatedAt,
    } as QuestionnaireEntity
  } catch (error) {
    console.error('[findQuestionnaireById] error', error)
    throw error
  }
}

/**
 * Busca todos os questionnaires para um paciente (collection: 'questionnaires')
 */
export async function findAllQuestionnairesByPatient(
  patientId: string,
): Promise<QuestionnaireEntity[]> {
  const coll = collection(firestore, 'questionnaires')
  try {
    const q = query(
      coll,
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc'),
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) return []

    return snapshot.docs.map((docItem) => {
      const data = docItem.data() as Omit<QuestionnaireEntity, 'id'>
      return {
        id: docItem.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : data.createdAt,
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate()
            : data.updatedAt,
      } as QuestionnaireEntity
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[findAllQuestionnairesByPatient] error', error)
    throw error
  }
}
