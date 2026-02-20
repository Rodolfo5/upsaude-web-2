/**
 * Scheduler para lembrete diário de atividades do plano terapêutico.
 *
 * Roda às 8h da manhã e verifica se cada paciente tem alguma atividade
 * para hoje em qualquer um dos pilares (Saúde Mental, Estilo de Vida, Biomarcadores).
 * Se tiver, envia notificação push.
 */

import { getAdminApp, adminFirestore } from '@/config/firebase/firebaseAdmin'
import { NotificationEntity } from '@/types/entities/notification'

const HEALTH_PILLAR_TYPES = [
  'Saúde Mental',
  'Estilo de Vida',
  'Biomarcadores de Saúde',
] as const

type FirestoreTimestamp = { toDate?(): Date } | Date | undefined

type MentalHealthFrequency =
  | 'Diariamente'
  | 'Semanalmente'
  | 'Quinzenalmente'
  | 'Mensalmente'

interface ActivityData {
  frequency?: string
  frequencyUnit?: string
  frequencyValue?: string
  selectedDays?: number[]
  status: string
  createdAt: FirestoreTimestamp
  endDate?: FirestoreTimestamp
}

function toDate(value: FirestoreTimestamp | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  return null
}

/**
 * Verifica se uma atividade de Saúde Mental se aplica hoje.
 */
function isMentalHealthActivityForToday(activity: ActivityData): boolean {
  if (activity.status !== 'Ativa') return false

  const createdAt = toDate(activity.createdAt)
  const endDate = toDate(activity.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (!createdAt) return false
  const createdDate = new Date(createdAt)
  createdDate.setHours(0, 0, 0, 0)

  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    if (today > end) return false
  }
  if (today < createdDate) return false

  const frequency = (activity.frequency || '') as MentalHealthFrequency

  switch (frequency) {
    case 'Diariamente':
      return true
    case 'Semanalmente': {
      return today.getDay() === createdDate.getDay()
    }
    case 'Quinzenalmente': {
      const diffMs = today.getTime() - createdDate.getTime()
      const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
      return diffWeeks % 2 === 0 && today.getDay() === createdDate.getDay()
    }
    case 'Mensalmente':
      return today.getDate() === createdDate.getDate()
    default:
      return false
  }
}

/**
 * Verifica se uma atividade de Estilo de Vida ou Biomarcadores se aplica hoje.
 */
function isLifestyleOrBiomarkerActivityForToday(
  activity: ActivityData,
): boolean {
  if (activity.status !== 'Ativa') return false

  const createdAt = toDate(activity.createdAt)
  const endDate = toDate(activity.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (!createdAt) return false
  const createdDate = new Date(createdAt)
  createdDate.setHours(0, 0, 0, 0)

  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    if (today > end) return false
  }
  if (today < createdDate) return false

  const unit = activity.frequencyUnit || ''
  const selectedDays = activity.selectedDays ?? []

  switch (unit) {
    case 'Dia':
      return true
    case 'Semana':
    case 'Mês':
      return selectedDays.includes(today.getDay())
    default:
      return false
  }
}

/**
 * Verifica se alguma atividade do pilar se aplica hoje.
 */
function pillarHasActivityForToday(
  pillarType: string,
  activities: ActivityData[],
): boolean {
  for (const activity of activities) {
    if (pillarType === 'Saúde Mental') {
      if (isMentalHealthActivityForToday(activity)) return true
    } else {
      if (isLifestyleOrBiomarkerActivityForToday(activity)) return true
    }
  }
  return false
}

/**
 * Envia notificação push para o paciente.
 */
async function sendPushNotification(
  patientId: string,
  tokens: string[],
  baseUrl: string,
): Promise<void> {
  if (tokens.length === 0) return

  const notificationData: Omit<NotificationEntity, 'id' | 'createdAt'> = {
    title: 'Atividades de hoje',
    content:
      'Você tem atividades do seu plano terapêutico para realizar hoje. Acesse o app e confira!',
    type: 'Plano Terapêutico',
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

/**
 * Executa o cron de lembrete diário de atividades.
 */
export async function runDailyActivitiesReminder(): Promise<{
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
      const plansSnapshot = await db
        .collection('users')
        .doc(patientId)
        .collection('therapeuticPlans')
        .orderBy('createdAt', 'desc')
        .get()

      let availablePlanId: string | null = null
      for (const planDoc of plansSnapshot.docs) {
        const planData = planDoc.data()
        if (planData.status === 'available') {
          availablePlanId = planDoc.id
          break
        }
      }

      if (!availablePlanId) continue

      const pillarsSnapshot = await db
        .collection('users')
        .doc(patientId)
        .collection('therapeuticPlans')
        .doc(availablePlanId)
        .collection('healthPillars')
        .get()

      let hasActivityToday = false

      for (const pillarDoc of pillarsSnapshot.docs) {
        const pillarData = pillarDoc.data()
        const pillarType = pillarData.type as string

        if (!(HEALTH_PILLAR_TYPES as readonly string[]).includes(pillarType))
          continue

        const activitiesSnapshot = await db
          .collection('users')
          .doc(patientId)
          .collection('therapeuticPlans')
          .doc(availablePlanId)
          .collection('healthPillars')
          .doc(pillarDoc.id)
          .collection('activities')
          .get()

        const activities: ActivityData[] = activitiesSnapshot.docs.map(
          (doc) => {
            const d = doc.data()
            return {
              frequency: d.frequency,
              frequencyUnit: d.frequencyUnit,
              frequencyValue: d.frequencyValue,
              selectedDays: Array.isArray(d.selectedDays) ? d.selectedDays : [],
              status: d.status || 'Ativa',
              createdAt: d.createdAt,
              endDate: d.endDate,
            }
          },
        )

        if (pillarHasActivityForToday(pillarType, activities)) {
          hasActivityToday = true
          break
        }
      }

      if (hasActivityToday && tokens.length > 0) {
        await sendPushNotification(patientId, tokens, baseUrl)
        notified++
      }
    } catch (error) {
      console.error(`Erro ao processar paciente ${patientId}:`, error)
      errors++
    }
  }

  return { processed, notified, errors }
}
