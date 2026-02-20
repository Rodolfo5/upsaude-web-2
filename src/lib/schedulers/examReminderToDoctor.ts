/**
 * Scheduler para notificar médicos sobre exames com status "requested" (não realizados).
 *
 * Roda às 5h da manhã e:
 * 1. Consulta todos os exames em users/{userId}/exams com status = "requested"
 * 2. Cria uma doctorNotification por (médico, paciente, exame) — uma notificação por usuário/pendência
 */

import admin from 'firebase-admin'

import { getAdminApp, adminFirestore } from '@/config/firebase/firebaseAdmin'

const USERS_COLLECTION = 'users'
const DOCTOR_NOTIFICATIONS_COLLECTION = 'doctorNotifications'

export interface ExamReminderResult {
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

export async function runExamReminderToDoctor(): Promise<ExamReminderResult> {
  await getAdminApp()
  const db = adminFirestore()

  let notificationsCreated = 0
  let errors = 0

  try {
    // Listar users e, para cada um, consultar exams com status "requested"
    // (evita collection group e índice no Firestore)
    const usersSnap = await db.collection(USERS_COLLECTION).get()

    const pendingByUser = await Promise.all(
      usersSnap.docs.map(async (userDoc) => {
        const patientId = userDoc.id
        const examsSnap = await db
          .collection(USERS_COLLECTION)
          .doc(patientId)
          .collection('exams')
          .where('status', '==', 'requested')
          .get()

        const items: Array<{
          doctorId: string
          patientId: string
          examName: string
        }> = []
        for (const docSnap of examsSnap.docs) {
          const data = docSnap.data()
          const doctorId = (data.doctorId as string) || ''
          if (!doctorId) continue
          const examName = (data.examName as string) || 'Exame'
          items.push({ doctorId, patientId, examName })
        }
        return items
      }),
    )

    // Agrupar por médico e deduplicar (patientId, examName) para não repetir a mesma linha
    const byDoctor = new Map<
      string,
      Array<{ patientId: string; examName: string }>
    >()
    const seenByDoctor = new Map<string, Set<string>>()
    for (const item of pendingByUser.flat()) {
      const key = `${item.patientId}|${item.examName}`
      if (!seenByDoctor.has(item.doctorId))
        seenByDoctor.set(item.doctorId, new Set())
      if (seenByDoctor.get(item.doctorId)!.has(key)) continue
      seenByDoctor.get(item.doctorId)!.add(key)
      if (!byDoctor.has(item.doctorId)) byDoctor.set(item.doctorId, [])
      byDoctor.get(item.doctorId)!.push({
        patientId: item.patientId,
        examName: item.examName,
      })
    }

    const allPatientIds = [
      ...new Set(
        [...byDoctor.values()].flatMap((items) =>
          items.map((i) => i.patientId),
        ),
      ),
    ]
    const patientNamesMap = await getPatientNames(db, allPatientIds)

    // Uma notificação por (médico, paciente, exame)
    for (const [doctorId, items] of byDoctor.entries()) {
      for (const item of items) {
        try {
          const patientName =
            patientNamesMap.get(item.patientId) || item.patientId
          const content = `${patientName} - ${item.examName} ainda não realizou o exame.`

          await db.collection(DOCTOR_NOTIFICATIONS_COLLECTION).add({
            title: 'Exame pendente',
            content,
            users: [doctorId],
            type: 'Exames',
            status: '',
            hasSeenToUsers: [],
            createdAt: new Date(),
          })

          notificationsCreated++
        } catch (err) {
          console.error(
            `Erro ao criar notificação de exame para médico ${doctorId}:`,
            err,
          )
          errors++
        }
      }
    }

    return { notificationsCreated, errors }
  } catch (err) {
    console.error('Erro ao executar examReminderToDoctor:', err)
    throw err
  }
}
