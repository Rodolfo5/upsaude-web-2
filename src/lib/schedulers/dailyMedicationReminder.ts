/**
 * Scheduler para lembrete de medicamento 30 min antes da dose.
 *
 * Deve ser executado de forma recorrente (ex: a cada 5 minutos),
 * verificando doses previstas para "agora + 30 min" em janela curta.
 */

import admin from 'firebase-admin'

import { getAdminApp, adminFirestore } from '@/config/firebase/firebaseAdmin'
import { NotificationEntity } from '@/types/entities/notification'

type FirestoreTimestamp = admin.firestore.Timestamp | { toDate?(): Date } | Date

const THIRTY_MINUTES_MS = 30 * 60 * 1000
const FIVE_MINUTES_MS = 5 * 60 * 1000

function toDate(value: FirestoreTimestamp | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  return null
}

function isMedicationEligible(medication: {
  usageClassification?: string
  status?: string
}): boolean {
  const usageClassification = medication.usageClassification || ''
  const status = medication.status || ''
  if (status === 'SUSPENDED' || status === 'CLOSED') return false

  return (
    usageClassification === 'Uso contínuo' ||
    usageClassification === 'Tratamento'
  )
}

function isAfterTreatmentEnd(
  medication: {
    usageClassification?: string
    endDate?: FirestoreTimestamp
  },
  referenceDate: Date,
): boolean {
  if (medication.usageClassification !== 'Tratamento' || !medication.endDate) {
    return false
  }

  const endDate = toDate(medication.endDate)
  if (!endDate) return false

  const endOfEndDate = new Date(endDate)
  endOfEndDate.setHours(23, 59, 59, 999)
  return referenceDate > endOfEndDate
}

/**
 * Gera todas as doses do medicamento em um intervalo.
 */
function getMedicationDosesInRange(medication: {
  startDate?: FirestoreTimestamp
  createdAt?: FirestoreTimestamp
  interval?: number
  intervalUnit?: string
  endDate?: FirestoreTimestamp
  usageClassification?: string
}): Date[] {
  if (!medication.interval || !medication.intervalUnit) return []

  const unit = medication.intervalUnit
  if (unit !== 'Horas' && unit !== 'Dias') return []

  const startDate = toDate(medication.startDate) ?? toDate(medication.createdAt)
  if (!startDate) return []
  startDate.setSeconds(0, 0)

  const now = new Date()
  const windowStart = new Date(
    now.getTime() + THIRTY_MINUTES_MS - FIVE_MINUTES_MS,
  )
  const windowEnd = new Date(now.getTime() + THIRTY_MINUTES_MS)

  if (isAfterTreatmentEnd(medication, windowStart)) return []

  const doses: Date[] = []
  const interval = medication.interval

  if (unit === 'Dias') {
    const doseTime = new Date(windowStart)
    doseTime.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0)
    const diffDays = Math.floor(
      (doseTime.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
    )

    if (diffDays >= 0 && diffDays % interval === 0) {
      if (doseTime >= windowStart && doseTime <= windowEnd) {
        doses.push(doseTime)
      }
    }

    return doses
  }

  // Unidade em horas
  const intervalMs = interval * 60 * 60 * 1000
  if (intervalMs <= 0) return []

  let firstDoseInWindow = new Date(startDate)
  if (firstDoseInWindow < windowStart) {
    const elapsed = windowStart.getTime() - firstDoseInWindow.getTime()
    const jumps = Math.ceil(elapsed / intervalMs)
    firstDoseInWindow = new Date(
      firstDoseInWindow.getTime() + jumps * intervalMs,
    )
  }

  for (
    let current = new Date(firstDoseInWindow);
    current <= windowEnd;
    current = new Date(current.getTime() + intervalMs)
  ) {
    if (current >= windowStart) {
      doses.push(new Date(current))
    }
  }

  return doses
}

async function sendMedicationNotification(
  patientId: string,
  medicationName: string,
  doseTime: Date,
  tokens: string[],
  baseUrl: string,
): Promise<void> {
  if (tokens.length === 0) return

  const formattedHour = doseTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const notificationData: Omit<NotificationEntity, 'id' | 'createdAt'> = {
    title: 'Lembrete de medicamento',
    content: `Faltam 30 minutos para tomar ${medicationName}.`,
    type: 'Medicamento',
    users: [{ userId: patientId, tokens }],
    status: '',
    date: null,
    hasSeenToUsers: [],
  }

  const url = `${baseUrl}/api/notifications`
  const response = await fetch(url, {
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

  if (!response.ok) {
    throw new Error(
      `Falha ao enviar push de medicamento: status ${response.status}`,
    )
  }
}

function buildDoseKey(
  patientId: string,
  medicationId: string,
  doseTime: Date,
): string {
  const yyyy = String(doseTime.getFullYear())
  const mm = String(doseTime.getMonth() + 1).padStart(2, '0')
  const dd = String(doseTime.getDate()).padStart(2, '0')
  const hh = String(doseTime.getHours()).padStart(2, '0')
  const mi = String(doseTime.getMinutes()).padStart(2, '0')
  return `${patientId}_${medicationId}_${yyyy}${mm}${dd}${hh}${mi}`
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
    if (tokens.length === 0) continue

    try {
      const medicationsSnapshot = await db
        .collection('users')
        .doc(patientId)
        .collection('medications')
        .get()

      for (const medDoc of medicationsSnapshot.docs) {
        const data = medDoc.data()
        if (!isMedicationEligible(data)) continue

        const dosesInWindow = getMedicationDosesInRange(data)
        if (dosesInWindow.length === 0) continue

        for (const doseTime of dosesInWindow) {
          const doseKey = buildDoseKey(patientId, medDoc.id, doseTime)
          const logRef = db
            .collection('cronMedicationReminderLogs')
            .doc(doseKey)
          const logSnapshot = await logRef.get()

          if (logSnapshot.exists) {
            continue
          }

          const medicationName =
            typeof data.name === 'string' && data.name.trim() !== ''
              ? data.name
              : 'seu medicamento'

          await sendMedicationNotification(
            patientId,
            medicationName,
            doseTime,
            tokens,
            baseUrl,
          )

          await logRef.set({
            patientId,
            medicationId: medDoc.id,
            medicationName,
            doseAt: doseTime,
            sentAt: new Date(),
          })

          notified++
        }
      }
    } catch (error) {
      console.error(`Erro ao processar paciente ${patientId}:`, error)
      errors++
    }
  }

  return { processed, notified, errors }
}
