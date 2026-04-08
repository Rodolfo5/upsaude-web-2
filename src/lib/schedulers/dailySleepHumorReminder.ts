/**
 * Scheduler para lembrete de sono e humor.
 *
 * Roda às 10h da manhã e verifica se cada paciente informou o tempo de sono
 * e o humor de hoje. Se faltar qualquer um dos dois, envia notificação push.
 *
 * Estrutura no Firestore:
 * - Sono: healthPillars (Saúde Mental) > goals (Qualidade de Sono) > sleepTime
 * - Humor: healthPillars (Saúde Mental) > goals (Humor) > humor
 */

import admin from 'firebase-admin'

import { getAdminApp, adminFirestore } from '@/config/firebase/firebaseAdmin'
import { NotificationEntity } from '@/types/entities/notification'

async function hasDocumentWithCreatedAtToday(
  collectionRef: admin.firestore.CollectionReference,
): Promise<boolean> {
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

  const snapshot = await collectionRef
    .where('createdAt', '>=', startTimestamp)
    .where('createdAt', '<=', endTimestamp)
    .limit(1)
    .get()

  return !snapshot.empty
}

async function sendSleepHumorNotification(
  patientId: string,
  tokens: string[],
  message: string,
  baseUrl: string,
): Promise<void> {
  if (tokens.length === 0) return

  const notificationData: Omit<NotificationEntity, 'id' | 'createdAt'> = {
    title: 'Lembrete',
    content: message,
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

export async function runDailySleepHumorReminder(): Promise<{
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
        .where('type', '==', 'Saúde Mental')
        .get()

      if (pillarsSnapshot.empty) continue

      const mentalHealthPillar = pillarsSnapshot.docs[0]
      const pillarId = mentalHealthPillar.id

      const goalsSnapshot = await db
        .collection('users')
        .doc(patientId)
        .collection('therapeuticPlans')
        .doc(availablePlanId)
        .collection('healthPillars')
        .doc(pillarId)
        .collection('goals')
        .get()

      const sleepGoal = goalsSnapshot.docs.find(
        (d) =>
          d.data().type === 'Qualidade de Sono' && d.data().status === 'Ativa',
      )
      const humorGoal = goalsSnapshot.docs.find(
        (d) => d.data().type === 'Humor' && d.data().status === 'Ativa',
      )

      let missingSleep = false
      let missingHumor = false

      if (sleepGoal) {
        const sleepTimeRef = db
          .collection('users')
          .doc(patientId)
          .collection('therapeuticPlans')
          .doc(availablePlanId)
          .collection('healthPillars')
          .doc(pillarId)
          .collection('goals')
          .doc(sleepGoal.id)
          .collection('sleepTime')

        const hasSleepToday = await hasDocumentWithCreatedAtToday(sleepTimeRef)
        if (!hasSleepToday) missingSleep = true
      }

      if (humorGoal) {
        const humorRef = db
          .collection('users')
          .doc(patientId)
          .collection('therapeuticPlans')
          .doc(availablePlanId)
          .collection('healthPillars')
          .doc(pillarId)
          .collection('goals')
          .doc(humorGoal.id)
          .collection('humor')

        const hasHumorToday = await hasDocumentWithCreatedAtToday(humorRef)
        if (!hasHumorToday) missingHumor = true
      }

      if (!missingSleep && !missingHumor) continue

      let message: string
      if (missingSleep && missingHumor) {
        message = 'É hora de relatar o seu humor e o seu sono!'
      } else if (missingHumor) {
        message = 'É hora de relatar o seu humor!'
      } else {
        message = 'É hora de relatar o seu sono!'
      }

      if (tokens.length > 0) {
        await sendSleepHumorNotification(patientId, tokens, message, baseUrl)
        notified++
      }
    } catch (error) {
      console.error(`Erro ao processar paciente ${patientId}:`, error)
      errors++
    }
  }

  return { processed, notified, errors }
}
