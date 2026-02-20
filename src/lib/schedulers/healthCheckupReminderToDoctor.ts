/**
 * Scheduler para notificar médicos sobre check-ups digitais com status "REQUESTED" (pendentes).
 *
 * Roda às 5h da manhã e:
 * 1. Consulta todos os healthCheckups em users/{userId}/healthCheckups com status = "REQUESTED"
 * 2. Cria uma doctorNotification por (médico, paciente) — uma notificação por pendência
 */

import admin from 'firebase-admin'

import { getAdminApp, adminFirestore } from '@/config/firebase/firebaseAdmin'
import { CheckupStatus } from '@/types/entities/healthCheckup'

const USERS_COLLECTION = 'users'
const DOCTOR_NOTIFICATIONS_COLLECTION = 'doctorNotifications'

export interface HealthCheckupReminderResult {
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

export async function runHealthCheckupReminderToDoctor(): Promise<HealthCheckupReminderResult> {
  await getAdminApp()
  const db = adminFirestore()

  let notificationsCreated = 0
  let errors = 0

  try {
    const usersSnap = await db.collection(USERS_COLLECTION).get()

    const pendingByUser = await Promise.all(
      usersSnap.docs.map(async (userDoc) => {
        const userId = userDoc.id
        const checkupsSnap = await db
          .collection(USERS_COLLECTION)
          .doc(userId)
          .collection('healthCheckups')
          .where('status', '==', CheckupStatus.REQUESTED)
          .get()

        const items: Array<{ doctorId: string; patientId: string }> = []
        for (const docSnap of checkupsSnap.docs) {
          const data = docSnap.data()
          const doctorId = (data.doctorId as string) || ''
          if (!doctorId) continue
          items.push({ doctorId, patientId: userId })
        }
        return items
      }),
    )

    // Deduplicar por (doctorId, patientId) — um paciente pode ter mais de um checkup REQUESTED
    const byDoctor = new Map<string, string[]>()
    const seenByDoctor = new Map<string, Set<string>>()
    for (const item of pendingByUser.flat()) {
      if (!seenByDoctor.has(item.doctorId)) {
        seenByDoctor.set(item.doctorId, new Set())
      }
      if (seenByDoctor.get(item.doctorId)!.has(item.patientId)) continue
      seenByDoctor.get(item.doctorId)!.add(item.patientId)
      if (!byDoctor.has(item.doctorId)) byDoctor.set(item.doctorId, [])
      byDoctor.get(item.doctorId)!.push(item.patientId)
    }

    const allPatientIds = [
      ...new Set([...byDoctor.values()].flat()),
    ]
    const patientNamesMap = await getPatientNames(db, allPatientIds)

    for (const [doctorId, patientIds] of byDoctor.entries()) {
      for (const patientId of patientIds) {
        try {
          const patientName = patientNamesMap.get(patientId) || patientId
          const content = `${patientName} ainda não realizou o check-up digital.`

          await db.collection(DOCTOR_NOTIFICATIONS_COLLECTION).add({
            title: 'Check-up digital pendente',
            content,
            users: [doctorId],
            type: 'Check-Up digital',
            status: '',
            hasSeenToUsers: [],
            createdAt: new Date(),
          })

          notificationsCreated++
        } catch (err) {
          console.error(
            `Erro ao criar notificação de check-up para médico ${doctorId}:`,
            err,
          )
          errors++
        }
      }
    }

    return { notificationsCreated, errors }
  } catch (err) {
    console.error('Erro ao executar healthCheckupReminderToDoctor:', err)
    throw err
  }
}
