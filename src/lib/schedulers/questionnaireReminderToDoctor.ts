/**
 * Scheduler para notificar médicos sobre questionários com respostas pendentes.
 *
 * Roda às 5h da manhã e:
 * 1. Lista todos os documentos da coleção requestQuestionnaires
 * 2. Para cada um, identifica pacientes que ainda não responderam
 * 3. Cria uma notificação por questionário com pendentes, com os nomes
 *    das pessoas que não responderam
 */

import admin from 'firebase-admin'

import { getAdminApp, adminFirestore } from '@/config/firebase/firebaseAdmin'

const REQUEST_QUESTIONNAIRES_COLLECTION = 'requestQuestionnaires'
const USERS_COLLECTION = 'users'
const DOCTOR_NOTIFICATIONS_COLLECTION = 'doctorNotifications'

export interface QuestionnaireReminderResult {
  notificationsCreated: number
  errors: number
}

async function getPatientNames(
  db: admin.firestore.Firestore,
  patientIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const uniqueIds = [...new Set(patientIds)]

  await Promise.all(
    uniqueIds.map(async (id) => {
      const docRef = db.collection(USERS_COLLECTION).doc(id)
      const snap = await docRef.get()
      if (snap.exists) {
        const name = (snap.data()?.name as string) || snap.data()?.email || id
        map.set(id, name)
      } else {
        map.set(id, id)
      }
    }),
  )

  return map
}

export async function runQuestionnaireReminderToDoctor(): Promise<QuestionnaireReminderResult> {
  await getAdminApp()
  const db = adminFirestore()

  let notificationsCreated = 0
  let errors = 0

  try {
    const snapshot = await db
      .collection(REQUEST_QUESTIONNAIRES_COLLECTION)
      .get()

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      const doctorId = data.doctorId as string
      const patientIds = (data.patientIds as string[]) || []
      const patientsWhoResponded = (data.patientsWhoResponded as string[]) || []
      const questionnaireName =
        (data.questionnaireName as string) || 'Questionário'

      const pendingPatientIds = patientIds.filter(
        (id: string) => !patientsWhoResponded.includes(id),
      )

      if (pendingPatientIds.length === 0) continue

      try {
        const patientNamesMap = await getPatientNames(db, pendingPatientIds)
        const namesList = pendingPatientIds
          .map((id) => patientNamesMap.get(id) || id)
          .join(', ')
        const content = `${namesList} ainda não responderam ao questionário.`

        await db.collection(DOCTOR_NOTIFICATIONS_COLLECTION).add({
          title: `Questionário pendente: ${questionnaireName}`,
          content,
          users: [doctorId],
          type: 'Questionários de Saúde',
          status: '',
          hasSeenToUsers: [],
          createdAt: new Date(),
        })

        notificationsCreated++
      } catch (err) {
        console.error(
          `Erro ao criar notificação para questionário ${docSnap.id}:`,
          err,
        )
        errors++
      }
    }

    return { notificationsCreated, errors }
  } catch (err) {
    console.error('Erro ao executar questionnaireReminderToDoctor:', err)
    throw err
  }
}
