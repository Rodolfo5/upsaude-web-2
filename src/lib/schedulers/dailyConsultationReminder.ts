/**
 * Scheduler para lembrete de consultas do dia.
 *
 * Roda às 5h da manhã e verifica se cada paciente tem alguma consulta
 * agendada para hoje. Se tiver, envia notificação push.
 */

import admin from 'firebase-admin'

import { getAdminApp, adminFirestore } from '@/config/firebase/firebaseAdmin'
import { NotificationEntity } from '@/types/entities/notification'

const COLLECTION_NAME = 'consultations'

async function sendConsultationNotification(
  patientId: string,
  tokens: string[],
  baseUrl: string,
): Promise<void> {
  if (tokens.length === 0) return

  const notificationData: Omit<NotificationEntity, 'id' | 'createdAt'> = {
    title: 'Consulta de hoje',
    content: 'Você tem uma consulta agendada para hoje. Não esqueça!',
    type: 'Consulta',
    users: [{ userId: patientId, tokens }],
    status: '',
    date: null,
    hasSeenToUsers: [],
  }

  const url = `${baseUrl}/api/notifications`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: notificationData.type,
      title: notificationData.title,
      content: notificationData.content,
      date: null,
      users: notificationData.users,
      status: notificationData.status,
      hasSeenToUsers: notificationData.hasSeenToUsers,
    }),
  })
}

export async function runDailyConsultationReminder(): Promise<{
  processed: number
  notified: number
  errors: number
}> {
  await getAdminApp()
  const db = adminFirestore()

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000'

  const today = new Date()
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0,
  )
  const endOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999,
  )
  const startTimestamp = admin.firestore.Timestamp.fromDate(startOfToday)
  const endTimestamp = admin.firestore.Timestamp.fromDate(endOfToday)

  const consultationsSnapshot = await db
    .collection(COLLECTION_NAME)
    .where('date', '>=', startTimestamp)
    .where('date', '<=', endTimestamp)
    .get()

  const patientIdsWithConsultation = new Set<string>()

  consultationsSnapshot.docs.forEach((doc) => {
    const data = doc.data()
    if (data.status === 'CANCELLED') return
    const patientId = data.patientId
    if (patientId) {
      patientIdsWithConsultation.add(patientId)
    }
  })

  let notified = 0
  let errors = 0

  for (const patientId of patientIdsWithConsultation) {
    try {
      const patientDoc = await db.collection('users').doc(patientId).get()
      if (!patientDoc.exists) continue

      const patientData = patientDoc.data()
      const tokens: string[] = Array.isArray(patientData?.tokens)
        ? patientData.tokens
        : []

      if (tokens.length > 0) {
        await sendConsultationNotification(patientId, tokens, baseUrl)
        notified++
      }
    } catch (error) {
      console.error(`Erro ao notificar paciente ${patientId}:`, error)
      errors++
    }
  }

  return {
    processed: patientIdsWithConsultation.size,
    notified,
    errors,
  }
}
