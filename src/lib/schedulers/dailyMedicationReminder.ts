/**
 * Scheduler para lembrete de medicamentos do dia.
 *
 * Roda às 5h da manhã e verifica se cada paciente tem algum medicamento
 * para tomar hoje (Uso contínuo ou Tratamento, excluindo SUSPENDED).
 * Usa interval e intervalUnit para calcular se há dose no dia.
 */

import admin from 'firebase-admin'

import { getAdminApp, adminFirestore } from '@/config/firebase/firebaseAdmin'
import { NotificationEntity } from '@/types/entities/notification'

type FirestoreTimestamp = admin.firestore.Timestamp | { toDate?(): Date } | Date

function toDate(value: FirestoreTimestamp | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  return null
}

/**
 * Verifica se o medicamento tem alguma dose agendada para hoje,
 * baseado em startDate, interval e intervalUnit.
 */
function hasDoseToday(medication: {
  startDate?: FirestoreTimestamp
  createdAt?: FirestoreTimestamp
  interval?: number
  intervalUnit?: string
  endDate?: FirestoreTimestamp
  usageClassification?: string
}): boolean {
  if (!medication.interval || !medication.intervalUnit) return false

  const unit = medication.intervalUnit
  if (unit !== 'Horas' && unit !== 'Dias') return false

  const startDate = toDate(medication.startDate) ?? toDate(medication.createdAt)
  if (!startDate) return false

  if (medication.usageClassification === 'Tratamento' && medication.endDate) {
    const endDate = toDate(medication.endDate)
    if (endDate) {
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (today > endDate) return false
    }
  }

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

  let currentTime = new Date(startDate)
  const maxIterations = 1000
  let iterations = 0

  while (currentTime <= endOfToday && iterations < maxIterations) {
    iterations++
    if (currentTime >= startOfToday) {
      return true
    }

    if (unit === 'Horas') {
      currentTime = new Date(
        currentTime.getTime() + medication.interval! * 60 * 60 * 1000,
      )
    } else {
      currentTime = new Date(currentTime)
      currentTime.setDate(currentTime.getDate() + medication.interval!)
    }
  }

  return false
}

async function sendMedicationNotification(
  patientId: string,
  tokens: string[],
  baseUrl: string,
): Promise<void> {
  if (tokens.length === 0) return

  const notificationData: Omit<NotificationEntity, 'id' | 'createdAt'> = {
    title: 'Medicamentos de hoje',
    content: 'Você tem medicamentos para tomar hoje. Não esqueça!',
    type: 'Medicamento',
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

export async function runDailyMedicationReminder(): Promise<{
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

  let processed = 0
  let notified = 0
  let errors = 0

  const patientsSnapshot = await db
    .collection('users')
    .where('role', '==', 'PATIENT')
    .get()

  for (const patientDoc of patientsSnapshot.docs) {
    const patientId = patientDoc.id
    const patientData = patientDoc.data()
    const tokens: string[] = Array.isArray(patientData.tokens)
      ? patientData.tokens
      : []

    processed++

    try {
      const medicationsSnapshot = await db
        .collection('users')
        .doc(patientId)
        .collection('medications')
        .get()

      let hasMedicationToday = false

      for (const medDoc of medicationsSnapshot.docs) {
        const data = medDoc.data()
        const usageClassification = data.usageClassification || ''
        const status = data.status || ''

        if (status === 'SUSPENDED') continue
        if (
          usageClassification !== 'Uso contínuo' &&
          usageClassification !== 'Tratamento'
        )
          continue

        if (hasDoseToday(data)) {
          hasMedicationToday = true
          break
        }
      }

      if (hasMedicationToday && tokens.length > 0) {
        await sendMedicationNotification(patientId, tokens, baseUrl)
        notified++
      }
    } catch (error) {
      console.error(`Erro ao processar paciente ${patientId}:`, error)
      errors++
    }
  }

  return { processed, notified, errors }
}
