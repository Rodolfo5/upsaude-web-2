/**
 * Scheduler para lembretes de consulta (24h, 12h, 3h antes).
 *
 * Busca consultas próximas e dispara notificações por e-mail para os médicos.
 */

import {
  collection,
  getDocs,
  getFirestore,
  query,
  Timestamp,
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import { notifyConsultationReminder } from '@/services/emailNotification'

const db = getFirestore(firebaseApp)
const COLLECTION_NAME = 'consultations'

type Timeframe = '24h' | '12h' | '3h'

const HOURS_MAP: Record<Timeframe, number> = {
  '24h': 24,
  '12h': 12,
  '3h': 3,
}

/**
 * Busca consultas que estão dentro da janela de tempo para lembrete.
 */
async function getConsultationsForReminder(
  timeframe: Timeframe,
): Promise<Array<{ id: string; doctorId: string; date: Date; hour: string }>> {
  const hours = HOURS_MAP[timeframe]
  const now = new Date()
  const windowStart = new Date(
    now.getTime() + hours * 60 * 60 * 1000 - 30 * 60 * 1000,
  )
  const windowEnd = new Date(
    now.getTime() + hours * 60 * 60 * 1000 + 30 * 60 * 1000,
  )

  const consultationsRef = collection(db, COLLECTION_NAME)
  const q = query(
    consultationsRef,
    where('date', '>=', Timestamp.fromDate(windowStart)),
    where('date', '<=', Timestamp.fromDate(windowEnd)),
  )

  const snapshot = await getDocs(q)
  const result: Array<{
    id: string
    doctorId: string
    date: Date
    hour: string
  }> = []

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data()
    const status = data.status || ''
    if (status === 'CANCELLED') return

    const date = data.date?.toDate ? data.date.toDate() : new Date(data.date)
    const hour = data.hour || ''
    const doctorId = data.doctorId || ''

    if (doctorId) {
      result.push({
        id: docSnap.id,
        doctorId,
        date,
        hour,
      })
    }
  })

  return result
}

/**
 * Processa e envia lembretes de consulta para um timeframe específico.
 */
export async function processConsultationReminders(
  timeframe: Timeframe,
): Promise<{ sent: number; errors: number }> {
  const consultations = await getConsultationsForReminder(timeframe)
  let sent = 0
  let errors = 0

  for (const consultation of consultations) {
    try {
      const dateTimeStr =
        consultation.hour && consultation.date
          ? `${consultation.hour}, ${consultation.date.toLocaleDateString(
              'pt-BR',
              {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              },
            )}`
          : consultation.date?.toLocaleDateString('pt-BR') || ''

      await notifyConsultationReminder(
        consultation.doctorId,
        consultation.id,
        dateTimeStr,
        timeframe,
      )
      sent++
    } catch (error) {
      console.error(
        `Erro ao enviar lembrete de consulta ${consultation.id}:`,
        error,
      )
      errors++
    }
  }

  return { sent, errors }
}

/**
 * Executa todos os lembretes (24h, 12h, 3h).
 */
export async function runAllConsultationReminders(): Promise<{
  '24h': { sent: number; errors: number }
  '12h': { sent: number; errors: number }
  '3h': { sent: number; errors: number }
}> {
  const [result24h, result12h, result3h] = await Promise.all([
    processConsultationReminders('24h'),
    processConsultationReminders('12h'),
    processConsultationReminders('3h'),
  ])

  return {
    '24h': result24h,
    '12h': result12h,
    '3h': result3h,
  }
}
